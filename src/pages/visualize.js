import './visualize.less'

import { Button, Checkbox, Form, InputNumber, Radio, Select, Slider, Switch } from 'antd'
import qs from 'query-string'
import React, { useEffect, useState } from 'react'

import api from '../api'
import _data from '../assets/graph.small.json'
import Graph from '../comp/Graph'
import { useAppContext } from '../context/AppContext'
import { useApi, useAsyncMemo, useDebouncedState, useRouter } from '../hooks'
import {
    edgeCreateIgnore,
    edgeCreationOrder,
    edgeOptions,
    formatArticleListGraphResponse,
    nodeOptions,
    range
} from '../utils'

const parseQuery = url => {
    return qs.parse(url, {
        parseNumbers: true,
        parseBooleans: true,
        arrayFormat: 'bracket-separator',
        arrayFormatSeparator: ','
    })
}

const colorNodeByOptions = [
    { value: 'metric', label: 'Metrics' },
    { value: 'type', label: 'Type' },
    { value: 'component', label: 'Component' }
]

const colorEdgeByOptions = [
    { value: 'type', label: 'Type' },
    { value: 'component', label: 'Component' }
]

const metricsOptions = [
    { value: 'degree_centrality', label: 'degree' },
    { value: 'eigenvector_centrality', label: 'eigenvector' },
    { value: 'closeness_centrality', label: 'closeness' },
    { value: 'betweenness_centrality', label: 'betweenness' }
    // { value: 'communicability_centrality', label: 'communicability' },
    // { value: 'load_centrality', label: 'load' },
    // { value: 'subgraph_centrality', label: 'subgraph' },
    // { value: 'harmonic_centrality', label: 'harmonic' },
    // { value: 'voterank', label: 'voterank' }
]

const formItemLayout = {
    labelCol: {
        span: 10
    },
    wrapperCol: {
        span: 16
    }
}

const data = (() => {
    return _data
})()

export default function Visualize(props) {
    const { py, isPyReady } = useAppContext()
    const router = useRouter()
    const { id } = router.match.params

    const query = parseQuery(router.location.search)

    const [form] = Form.useForm()
    const initialValues = {
        connectedComponentCount: 1,
        colorNodeBy: 'type',
        colorEdgeBy: 'component',
        metrics: {
            degree_centrality: 1,
            eigenvector_centrality: 1,
            closeness_centrality: 1,
            betweenness_centrality: 1
        }
    }

    const [params, setParams] = useState(initialValues)
    const dataLoading = false

    // const [data, dataLoading] = useApi('get', `/article-list/${id}/graph/`, {
    //     processData: formatArticleListGraphResponse
    // })

    const [graph, graphLoading] = useAsyncMemo(async () => {
        const { nodes, edges, removeIsolates } = query
        // if (!data) return

        if (!isPyReady) return

        // setMsg('Loading graph into NetworkX')
        console.log('load', data)
        await py.load_graph(data)

        console.log('node types', await py.get_node_types())
        console.log('edge types', await py.get_edge_types())

        console.log(await py.get_info())

        const allEdges = edgeOptions.map(e => e.value)
        const allNodes = nodeOptions.map(e => e.value)

        const addEdges = edgeCreationOrder.filter(e => edges.includes(e))
        const removeEdges = allEdges.filter(e => !edges.includes(e))
        const removeNodes = allNodes.filter(n => !nodes.includes(n))

        // NOTE: we don't really add nodes
        // for (const node of addNodes) {
        //     console.log('add node', node)
        //     setMsg('Generationg nodes of type', node)
        //     await py.add_nodes_of_type(node)
        // }

        for (const edge of addEdges) {
            console.log('add edge', edge)
            // setMsg('Generating edges of type', edge)

            if (edgeCreateIgnore.includes(edge)) {
                console.log('Skipping', edge)
                continue
            }
            await py.add_edges_of_type(edge)
        }

        for (const node of removeNodes) {
            console.log('remove node', node)
            // setMsg('Removing nodes of type', node)
            await py.remove_nodes_of_type(node)
        }

        for (const edge of removeEdges) {
            console.log('remove edge', edge)
            // setMsg('Removing edges of type', edge)
            await py.remove_edges_of_type(edge)
        }

        if (removeIsolates) {
            console.log('remove isolates')
            // setMsg('Removing isolates')
            const isolateCount = await py.count_isolates()
            await py.remove_isolates()
            console.log(`removed ${isolateCount} isolates`)
            // setMsg(`Removed ${isolateCount} isolates`)
        }

        console.log('finding connected components')
        // setMsg('Finding connected components')
        await py.add_connected_component_attr()

        console.log('adding metrics')
        await py.add_metric_attrs()

        // setMsg('The graph is ready for visualization! Redirecting...')
        console.log('done')
        console.log(await py.get_info())

        console.log('components', await py.get_size_of_connected_components())

        return {
            nodes: await py.get_nodes(),
            edges: await py.get_edges(),
            connectedComponentCount: await py.get_number_connected_components(),
            components: await py.get_connected_components_info()
        }
    }, [data, isPyReady])

    if (!isPyReady) {
        return 'Loading Python...'
    }

    if (dataLoading || !graph) {
        return 'Downloading graph...'
    }

    if (graphLoading || !graph) {
        return 'Loading graph...'
    }

    console.log(params)

    return (
        <div className="visualize">
            <div className="graph">
                <Graph graph={graph} params={params} />
            </div>
            <div className="side">
                <Form form={form} {...formItemLayout} preserve onFinish={setParams} initialValues={initialValues}>
                    Connected components
                    <Form.Item name={'connectedComponentCount'} label="Top Conn. Comps">
                        <Slider
                            min={1}
                            // max={graph?.connectedComponentCount ?? 10}
                            max={10}
                            // value={Math.min(_connectedComponentCount, graph.connectedComponentCount)}
                            // onChange={setConnectedComponentCount}
                        />
                    </Form.Item>
                    Coloring
                    <Form.Item name={'colorNodeBy'} label="Color node by">
                        <Select options={colorNodeByOptions} />
                    </Form.Item>
                    <Form.Item name={'colorEdgeBy'} label="Color edge by">
                        <Select options={colorEdgeByOptions} />
                    </Form.Item>
                    Centrality metrics
                    {metricsOptions.map(({ value, label }) => {
                        return (
                            <Form.Item key={value} name={['metrics', value]} label={label}>
                                <InputNumber min={0} max={100} />
                            </Form.Item>
                        )
                    })}
                    <Button htmlType="submit" type="primary">
                        Confirm
                    </Button>
                </Form>
            </div>
        </div>
    )
}

// useEffect(() => {
//     if (!isGraphReady) return
//     ;(async () => {
//         const ccCount = await py.get_number_connected_components()
//         const connectedComponents = range(Math.min(ccCount, connectedComponentCount))
//         const newGraph = await py.get_subgraph_of_connected_components(connectedComponents)
//         console.log('new graph', newGraph)
//         setGraph(g => ({ ...g, ...newGraph }))
//     })()
// }, [isGraphReady, connectedComponentCount])
