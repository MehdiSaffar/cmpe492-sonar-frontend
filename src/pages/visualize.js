import './visualize.less'

import { Slider } from 'antd'
import qs from 'query-string'
import React, { useEffect, useState } from 'react'

import api from '../api'
import Graph from '../comp/Graph'
// import Render from '../comp/Render'
import { useAppContext } from '../context/AppContext'
import { useRouter } from '../hooks/hooks'
import { useDebouncedState } from '../hooks/hooks'
import { range } from '../utils'

const parseQuery = url => {
    return qs.parse(url, {
        parseNumbers: true,
        parseBooleans: true,
        arrayFormat: 'bracket-separator',
        arrayFormatSeparator: ','
    })
}

function _Visualize(props) {
    const { py, graph, isGraphReady, setIsGraphReady, loadGraph, setGraph } = useAppContext()
    const router = useRouter()

    const query = parseQuery(router.location.search)
    const [connectedComponentCount, setConnectedComponentCount, _connectedComponentCount] = useDebouncedState(Infinity)

    useEffect(() => {
        console.log('viz')
        ;(async () => {
            setIsGraphReady(false)
            try {
                await loadGraph(query)
                setIsGraphReady(true)
            } catch (error) {
                setIsGraphReady(false)
                console.error(error)
            }
        })()
    }, [])

    useEffect(() => {
        if (!isGraphReady) return
        ;(async () => {
            const ccCount = await py.get_number_connected_components()
            const connectedComponents = range(Math.min(ccCount, connectedComponentCount))
            const newGraph = await py.get_subgraph_of_connected_components(connectedComponents)
            console.log('new graph', newGraph)
            setGraph(g => ({ ...g, ...newGraph }))
        })()
    }, [isGraphReady, connectedComponentCount])

    if (!(graph && isGraphReady)) {
        return 'Loading graph... please wait'
    }

    console.log(graph)

    return (
        <div className="visualize">
            <div className="graph">
                <Graph graph={graph} />
            </div>
            <div className="side">
                Top connected components
                <br />
                <Slider
                    min={1}
                    max={graph.connectedComponentCount}
                    value={Math.min(_connectedComponentCount, graph.connectedComponentCount)}
                    onChange={setConnectedComponentCount}
                />
            </div>
        </div>
    )
}

export default function Visualize(props) {
    const { isPyReady } = useAppContext()

    if (!isPyReady) {
        return <div>Please wait until Python is ready</div>
    }

    return <_Visualize {...props} />
}
