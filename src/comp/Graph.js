import { interpolateRdYlBu } from 'd3-scale-chromatic'
import { interpolateYlGn } from 'd3-scale-chromatic'
import hexOpacity from 'hex-color-opacity'
import hexToRgba from 'hex-to-rgba'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ForceGraph2D, ForceGraph3D } from 'react-force-graph'
import { withSize } from 'react-sizeme'
import rgbaToHex from 'rgb-hex'

import { useSet } from '../hooks'
import { getRange, getUniqueColor } from '../utils'

// const nodeColor = {
//     article: 'blue',
//     author: 'red',
//     topic: 'gray'
// }

// const edgeColor = {
//     author_of: 'orange',
//     topic_of: 'pink'
// }

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
    if (typeof link.source === 'string') {
        return link.source
    }

    return link.source.id
}

const getLinkTargetIdSafely = link => {
    if (typeof link.target === 'string') {
        return link.target
    }

    return link.target.id
}

const getAdjList = ({ links }) => {
    const obj = {}

    for (let link of links) {
        const source = getLinkSourceIdSafely(link)
        const target = getLinkTargetIdSafely(link)

        obj[source] = [...(obj[source] ?? []), target]
        obj[target] = [...(obj[target] ?? []), source]
    }

    return obj
}

function Graph({ size, graph, params, onClickNode }) {
    const graphData = useMemo(() => toReactForceGraph(graph), [graph])

    const adjList = useMemo(() => getAdjList(graphData), [graphData])

    const nodeProps = useMemo(() => {
        let nodes = calculateNodeMetrics(graphData.nodes, params.metrics)
        return createNodesHashmap(nodes)
    }, [graphData, params.metrics])

    const [metricMin, metricMax] = useMemo(() => {
        let values = Object.values(nodeProps).map(x => x.metric)
        return getRange(values)
    }, [nodeProps])

    const [highNode, setHighNode] = useState()
    // const [highLink, setHighLink] = useState()

    const [highNodes, highNodesFns] = useSet(new Set())
    // const [highLinks, highLinksFns] = useSet(new Set())

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
                (highNode === source && highNodesFns.has(target)) || (highNode === target && highNodesFns.has(source))
            )
        },
        [highNode, highNodes]
    )

    const isNodeHigh = useCallback(node => highNode === node.id || highNodesFns.has(node.id), [highNode, highNodes])

    const nodeColor = useCallback(
        node => {
            const getNodeColor = node => {
                if (params.colorNodeBy === 'type') {
                    return getUniqueColor(node.type)
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
                    return hexOpacity(color, 0.3)
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
                // if (params.colorEdgeBy === 'type') {
                //     return getUniqueColor(link.type)
                // }

                // if (params.colorEdgeBy === 'component') {
                //     // if (typeof link.source === 'string') {
                //     return getUniqueColor(nodeProps[getLinkSourceIdSafely(link)].component)
                //     // }

                //     // return getUniqueColor(link.source.component)
                // }

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
                    return hexOpacity(color, 0.3)
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

    // const linkDirectionalParticles = useCallback(
    //     link => {
    //         const source = getLinkSourceIdSafely(link)
    //         const target = getLinkTargetIdSafely(link)

    //         if (highNode === source && highNodesFns.has(target)) return 1
    //         if (highNode === target && highNodesFns.has(source)) return 1

    //         return 0
    //     },
    //     [highNode, highNodes]
    // )

    // const linkDirectionalParticleSpeed = useCallback(
    //     link => {
    //         const source = getLinkSourceIdSafely(link)
    //         const target = getLinkTargetIdSafely(link)

    //         if (highNode === source && highNodesFns.has(target)) return 0.01
    //         if (highNode === target && highNodesFns.has(source)) return -0.01

    //         return 0
    //     },
    //     [highNode, highNodes]
    // )

    const linkWidth = useCallback(link => (isLinkHigh(link) ? 2 : 1), [isLinkHigh])

    const nodeCanvasObject = useCallback(
        (node, ctx, globalScale) => {
            const label = node.id
            let fontSize = 12
            if (highNode && highNode === node.id) {
                fontSize += 6
            }

            if (highNodesFns.has(node.id)) {
                fontSize += 3
            }

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
                2 / globalScale
            )

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions)

            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = color
            // ctx.fillStyle = 'black'
            ctx.fillText(label, node.x, node.y)

            node.__bckgDimensions = bckgDimensions // to re-use in nodePointerAreaPaint
        },
        [highNode, highNodes]
    )

    const nodePointerAreaPaint = useCallback((node, color, ctx) => {
        ctx.fillStyle = color
        const bckgDimensions = node.__bckgDimensions
        bckgDimensions &&
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions)
    }, [])

    return (
        <ForceGraph2D
            {...size}
            graphData={graphData}
            nodeVal={10}
            nodeColor={nodeColor}
            linkColor={linkColor}
            onNodeClick={onClickNode}
            // linkDirectionalParticles={linkDirectionalParticles}
            // linkDirectionalParticleSpeed={linkDirectionalParticleSpeed}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkWidth={linkWidth}
            onNodeHover={onNodeHover}
            nodeResolution={1}
            cooldownTicks={50}
        />
    )
}

export default withSize({ monitorHeight: true, monitorWidth: true, noPlaceholder: false })(Graph)
