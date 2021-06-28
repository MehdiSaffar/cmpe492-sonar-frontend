import { interpolateYlGn } from 'd3-scale-chromatic'
// import { interpolateTurbo as interpolateYlGn } from 'd3-scale-chromatic'
// import { interpolatePlasma as interpolateYlGn } from 'd3-scale-chromatic'
import hexOpacity from 'hex-color-opacity'
import hexToRgba from 'hex-to-rgba'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ForceGraph2D, ForceGraph3D } from 'react-force-graph'
import { SizeMe, withSize } from 'react-sizeme'
import rgbaToHex from 'rgb-hex'
import ellipsis from 'text-ellipsis'

import { useSet } from '../hooks'
import { getRange, getUniqueColor, sleep } from '../utils'

const nodeColorMap = {
    article: '#0000FF',
    author: '#FF0000',
    topic: '#696969'
}

// const edgeColor = {
//     author_of: 'orange',
//     topic_of: 'pink'
// }

const getNodeName = node => {
    if (node.type === 'article') {
        return node.info.title
    }

    if (node.type === 'author') {
        return node.info.full_name
    }

    if (node.type === 'topic') {
        return node.key
    }
}

const toReactForceGraph = ({ nodes, edges, ...other }) => {
    return {
        nodes: nodes.map(([id, node]) => ({
            id,
            ...node
        })),
        links: edges.map(([source, target, edge]) => ({
            source,
            target,
            ...edge
        })),
        ...other
    }
}

const calculateMetricWeightSum = metrics => {
    let sum = 0
    for (const metricWeight of Object.values(metrics)) {
        sum += metricWeight
    }

    if (sum <= 0) {
        return 1
    }

    return sum
}

// const calculateMetric = (graph, metrics) => {
//     const metricWeightSum = calculateMetricWeightSum(metrics)

//     graph.nodes.forEach(node => {
//         node.metric = 0
//         for (let [metricKey, metricWeight] of Object.entries(metrics)) {
//             node.metric += node[metricKey] * metricWeight
//         }
//         node.metric /= metricWeightSum
//     })

//     return graph
// }

const calculateNodeMetrics = (nodes, metrics) => {
    console.log('metrics', metrics)
    const metricWeightSum = calculateMetricWeightSum(metrics)

    nodes.map(node => {
        node.metric = 0
        for (let [metricKey, metricWeight] of Object.entries(metrics)) {
            if (metricKey in node) {
                node.metric += node[metricKey] * metricWeight
            }
        }
        node.metric /= metricWeightSum
    })

    return nodes
}

const createNodesHashmap = nodes => {
    let obj = {}

    for (let node of nodes) {
        obj[node.id] = node
    }

    return obj
}

const getLinkSourceIdSafely = link => {
    if (typeof link.source === 'string' || typeof link.source === 'number') {
        return link.source
    }

    return link.source.id
}

const getLinkTargetIdSafely = link => {
    if (typeof link.target === 'string' || typeof link.target === 'number') {
        return link.target
    }

    return link.target.id
}

const getAdjList = links => {
    const obj = {}

    for (let link of links) {
        const source = getLinkSourceIdSafely(link)
        const target = getLinkTargetIdSafely(link)

        obj[source] = [...(obj[source] ?? []), target]
        obj[target] = [...(obj[target] ?? []), source]
    }

    return obj
}

function filterNodeOfComponent(graph, componentFocused) {
    const nodes = new Set(graph.nodes.filter(node => node.component === componentFocused).map(node => node.id))

    graph.nodes = graph.nodes.filter(node => nodes.has(node.id))
    graph.links = graph.links.filter(link => {
        return nodes.has(link.source) && nodes.has(link.target)
    })

    return graph
}

const Graph = forwardRef(({ size, graph, params, onClickNode, componentFocused }, ref) => {
    const graphData = useMemo(() => {
        console.log('componentFocused', componentFocused)
        let ret = toReactForceGraph(graph)
        if (componentFocused !== undefined) {
            ret = filterNodeOfComponent(ret, componentFocused)
        }
        return ret
    }, [graph, componentFocused])

    const adjList = useMemo(() => getAdjList(graphData.links), [graphData])

    const nodeProps = useMemo(() => {
        let nodes = calculateNodeMetrics(graphData.nodes, params.metrics)
        return createNodesHashmap(nodes)
    }, [graphData, params.metrics])

    const [metricMin, metricMax] = useMemo(() => {
        let values = Object.values(nodeProps).map(x => x.metric)
        return getRange(values)
    }, [nodeProps])

    const [linkCountMin, linkCountMax] = useMemo(() => {
        let values = graphData.links.map(link => link.count ?? 1)
        return getRange(values)
    }, [graphData.links])

    const [highNode, setHighNode] = useState()
    const [highLink, setHighLink] = useState()

    const [highNodes, highNodesFns] = useSet(new Set())

    const onNodeHover = useCallback(
        node => {
            if (!node) {
                setHighNode()
                highNodesFns.reset()
                return
            }

            setHighNode(node.id)
            highNodesFns.set(adjList[node.id])
        },
        [adjList, nodeProps]
    )

    const isLinkHigh = useCallback(
        link => {
            const source = getLinkSourceIdSafely(link)
            const target = getLinkTargetIdSafely(link)

            return (
                (highNode === source && highNodesFns.has(target)) ||
                (highNode === target && highNodesFns.has(source)) ||
                (highLink && source === getLinkSourceIdSafely(highLink) && target === getLinkTargetIdSafely(highLink))
            )
        },
        [highNode, highNodes, highLink]
    )

    const isNodeHigh = useCallback(node => highNode === node.id || highNodesFns.has(node.id), [highNode, highNodes])

    const nodeColor = useCallback(
        node => {
            const getNodeColor = node => {
                if (params.colorNodeBy === 'type') {
                    // return getUniqueColor(node.type)
                    return nodeColorMap[node.type]
                }

                if (params.colorNodeBy === 'component') {
                    return getUniqueColor(node.component)
                }

                if (params.colorNodeBy === 'metric') {
                    let value = nodeProps[node.id].metric
                    value = (value - metricMin) / (metricMax - metricMin)
                    return '#' + rgbaToHex(interpolateYlGn(value))
                }

                return '#b0b0b0'
            }

            const differentiateHighNodes = (node, color) => {
                if (highNode === undefined) {
                    return color
                }

                if (nodeProps[highNode].component === node.component && !isNodeHigh(node)) {
                    return hexOpacity(color, 0.2)
                }

                return color
            }

            let color = getNodeColor(node)
            color = differentiateHighNodes(node, color)
            color = hexToRgba(color)
            return color
        },
        [params.colorNodeBy, nodeProps, isNodeHigh]
    )

    const linkColor = useCallback(
        link => {
            // if (highNode === undefined) return 'rgba(0,0,0, 1)'
            // if (isLinkHigh(link)) return 'rgba(0,0,0,1)'
            // return 'rgba(0,0,0,0.1)'
            const getLinkColor = link => {
                if (params.colorEdgeBy === 'type') {
                    return getUniqueColor(link.type)
                }

                if (params.colorEdgeBy === 'component') {
                    return getUniqueColor(nodeProps[getLinkSourceIdSafely(link)].component)
                }

                return '#b0b0b0'
            }

            const differentiateHighLinks = (link, color) => {
                if (highNode === undefined) {
                    return color
                }

                if (
                    nodeProps[highNode].component === nodeProps[getLinkSourceIdSafely(link)].component &&
                    !isLinkHigh(link)
                ) {
                    return hexOpacity(color, 0.2)
                }

                return color
            }

            const makeSlightlyTransparent = color => {
                return hexOpacity(color, 0.6)
            }

            let color = getLinkColor(link)
            color = makeSlightlyTransparent(color)
            color = differentiateHighLinks(link, color)
            color = hexToRgba(color)
            return color
        },
        [params.colorEdgeBy, nodeProps, isLinkHigh]
    )

    const linkWidth = useCallback(
        link => {
            const width = ((link.count ?? 1) - linkCountMin) / (linkCountMax - linkCountMin)

            let ret = width
            ret *= 8
            ret += 1
            ret *= isLinkHigh(link) ? 2 : 1
            return ret
        },
        [graphData, isLinkHigh, linkCountMin, linkCountMax, highLink]
    )

    const getLabel = (node, { shorten = true }) => {
        function _1(node) {
            return getNodeName(node)
        }

        function _2(txt) {
            return ellipsis(txt, 15)
        }

        let ret = node
        ret = _1(ret)
        if (shorten) {
            ret = _2(ret)
        }

        ret = ret ?? '???'
        return ret
    }

    const nodeCanvasObject = useCallback(
        (node, ctx, globalScale) => {
            // font size
            let fontSize = 14
            if (highNode && highNode === node.id) {
                fontSize += 6
            }

            if (highNodesFns.has(node.id)) {
                fontSize += 3
            }

            // font size
            const label = getLabel(node, {
                shorten: !(highNode && highNode === node.id)
            })

            fontSize /= globalScale
            ctx.font = `${fontSize}px Sans-Serif`
            const textWidth = ctx.measureText(label).width
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) // some padding

            const color = nodeColor(node)

            ctx.fillStyle = color
            ctx.fillRect(
                node.x - bckgDimensions[0] / 2,
                node.y + bckgDimensions[1] / 2,
                bckgDimensions[0],
                8 / globalScale
            )

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions)

            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            // ctx.fillStyle = color
            // ctx.fillStyle = getUniqueColor(node.type)
            if (highNode && nodeProps[highNode].component === node.component && !isNodeHigh(node)) {
                ctx.fillStyle = hexOpacity(nodeColorMap[node.type], 0.1)
            } else {
                ctx.fillStyle = nodeColorMap[node.type]
            }

            ctx.fillText(label, node.x, node.y)

            node.__bckgDimensions = bckgDimensions // to re-use in nodePointerAreaPaint
        },
        [nodeProps, highNode, highNodes]
    )

    const nodePointerAreaPaint = useCallback((node, color, ctx) => {
        ctx.fillStyle = color
        const bckgDimensions = node.__bckgDimensions
        bckgDimensions &&
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions)
    }, [])

    const linkLabel = useCallback(link => {
        const source = ellipsis(getNodeName(link.source), 15)
        const target = ellipsis(getNodeName(link.target), 15)

        return `${source} <-> ${link.type}:${link.count ?? 1} <-> ${target}`
    }, [])

    const onLinkHover = useCallback(link => {
        setHighLink(link)
    }, [])

    const nodeVisibility = useCallback(
        node => {
            if (componentFocused === undefined) {
                return true
            }

            return node.component === componentFocused
        },
        [componentFocused]
    )

    const onBackgroundClick = useCallback(() => {
        onClickNode()
    }, [])

    const fgRef = useRef()

    useImperativeHandle(ref, () => ({
        zoomToFit: fgRef.current.zoomToFit
    }))

    const onEngineStop = useCallback(() => {
        fgRef.current.zoomToFit(400)
    }, [fgRef])

    useEffect(() => {
        sleep(200).then(onEngineStop)
    }, [componentFocused])

    return (
        <ForceGraph2D
            ref={fgRef}
            {...size}
            graphData={graphData}
            nodeVal={10}
            nodeColor={nodeColor}
            linkColor={linkColor}
            linkLabel={linkLabel}
            onNodeClick={onClickNode}
            onBackgroundClick={onBackgroundClick}
            nodeVisibility={nodeVisibility}
            // linkDirectionalParticles={linkDirectionalParticles}
            // linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkWidth={linkWidth}
            onNodeHover={onNodeHover}
            onLinkHover={onLinkHover}
            nodeResolution={1}
            cooldownTicks={400}
            // onEngineStop={onEngineStop}
        />
    )
})

export default Graph

// export default withSize({ monitorHeight: true, monitorWidth: true, noPlaceholder: false })(Graph)
