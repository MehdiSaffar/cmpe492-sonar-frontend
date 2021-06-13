import { interpolateRdYlBu } from 'd3-scale-chromatic'
import { useEffect, useMemo, useState } from 'react'
import { ForceGraph2D, ForceGraph3D } from 'react-force-graph'
import { withSize } from 'react-sizeme'

import api from '../api'
import { useAppContext } from '../context/AppContext'
import { getRange } from '../utils'

const nodeColor = {
    article: 'blue',
    author: 'red',
    topic: 'gray'
}

const edgeColor = {
    author_of: 'orange',
    topic_of: 'pink'
}

const toReactForceGraph = ({ nodes, edges }) => {
    const [min, max] = getRange(nodes.map(n => n[1].degree_centrality))

    return {
        nodes: nodes.map(node => ({
            id: node[0],
            ...node[1],
            color: interpolateRdYlBu(1 - (node[1].degree_centrality - min) / (max - min))
        })),
        links: edges.map(edge => ({
            source: edge[0],
            target: edge[1],
            ...edge[2],
            color: edgeColor[edge[2].type]
        }))
    }
}

function Graph({ size, graph }) {
    const graphData = useMemo(() => toReactForceGraph(graph), [graph])

    const [highNode, setHighNode] = useState()
    const [highEdge, setHighEdge] = useState()

    const onNodeHover = node => {
        setHighNode(node)
    }

    const onEdgeHover = edge => {
        setHighEdge(edge)
    }

    return (
        <ForceGraph2D
            {...size}
            graphData={graphData}
            nodeVal={10}
            nodeAutoColorBy={'color'}
            edgeAutoColorBy={'type'}
            // linkLabel={'type'}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.id
                let fontSize = 12
                if (highNode && highNode.id === node.id) {
                    fontSize += 6
                }
                fontSize /= globalScale
                ctx.font = `${fontSize}px Sans-Serif`
                const textWidth = ctx.measureText(label).width
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2) // some padding

                ctx.fillStyle = node.color
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
                ctx.fillStyle = node.color
                // ctx.fillStyle = 'black'
                ctx.fillText(label, node.x, node.y)

                node.__bckgDimensions = bckgDimensions // to re-use in nodePointerAreaPaint
            }}
            // nodePointerAreaPaint={(node, color, ctx) => {
            //     ctx.fillStyle = color
            //     const bckgDimensions = node.__bckgDimensions
            //     bckgDimensions &&
            //         ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions)
            // }}
            // nodeCanvasObjectMode={node => (highNode && highNode === node ? 'before' : undefined)}
            linkWidth={link => (highEdge && highEdge.source === link.source && highEdge.target === link.target ? 5 : 1)}
            onNodeHover={onNodeHover}
            // onNodeHover={onNodeHover}
            onLinkHover={onEdgeHover}
            // nodeResolution={1}
            cooldownTicks={10000}
        />
    )
}

export default withSize({ monitorHeight: true, monitorWidth: true, noPlaceholder: false })(Graph)
