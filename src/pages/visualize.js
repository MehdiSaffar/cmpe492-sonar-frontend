import './visualize.less'

import { Button, Form, InputNumber, Select, Slider } from 'antd'
import qs from 'query-string'
import React, { useCallback, useRef, useState } from 'react'

import Graph from '../comp/Graph'
import LoadingPage from '../comp/LoadingPage'
import { useAppContext } from '../context/AppContext'
import { useApi, useAsyncMemo, useRouter } from '../hooks'
import {
    edgeCreateIgnore,
    edgeCreationOrder,
    edgeOptions,
    formatArticleListGraphResponse,
    formatDate,
    nodeOptions
} from '../utils'

const parseQuery = url => {
    const obj = qs.parse(url, {
        parseNumbers: true,
        parseBooleans: true,
        arrayFormat: 'bracket-separator',
        arrayFormatSeparator: ','
    })

    obj.edges = obj.edges ?? []
    obj.nodes = obj.nodes ?? []
    obj.removeIsolates = obj.removeIsolates ?? false

    return obj
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
    // { value: 'betweenness_centrality', label: 'betweenness' } PROBLEM
    // { value: 'communicability_centrality', label: 'communicability' }, MISSING
    { value: 'load_centrality', label: 'load' },
    // { value: 'subgraph_centrality', label: 'subgraph' }, BAD
    { value: 'harmonic_centrality', label: 'harmonic' }
    // { value: 'voterank', label: 'voterank' } PROBLEM
]

const formItemLayout = {
    labelCol: {
        span: 10
    },
    wrapperCol: {
        span: 16
    }
}

function KVPair({ name, children }) {
    return (
        <div>
            <b>{name}:</b> {children}
        </div>
    )
}

function NodeInfos({ node }) {
    return (
        <>
            <h2>Info</h2>
            <KVPair name={'Degree'}>{node.degree}</KVPair>
            <KVPair name={'Component index'}>{node.component}</KVPair>

            <h3>Metrics</h3>
            {metricsOptions.map(({ value, label }) => {
                return (
                    <KVPair key={value} name={label}>
                        {node[value].toFixed(5)}
                    </KVPair>
                )
            })}
            <KVPair name={'weighted metric'}>{node.metric.toFixed(5)}</KVPair>
        </>
    )
}

function NodeDetails({ node }) {
    console.log('NodeDetails', node)
    if (!node) {
        return null
    }

    if (node.type === 'article') {
        return (
            <div className="node-details">
                <h1>Article details</h1>
                <KVPair name={'DOI'}>{node.info.doi}</KVPair>
                <KVPair name={'Title'}>{node.info.title}</KVPair>
                <KVPair name={'Cited by count'}>{node.info.cited_by_count}</KVPair>
                {node.created_date && <KVPair name={'Published date'}>{formatDate(node.created_date)}</KVPair>}
                <NodeInfos node={node} />
            </div>
        )
    }

    if (node.type === 'author') {
        return (
            <div className="node-details">
                <h1>Author details</h1>
                <KVPair name={'API ID'}>{node.info.id}</KVPair>
                <KVPair name={'Full name'}>{node.info.full_name}</KVPair>
                <KVPair name={'Citation count'}>{node.info.citation_count}</KVPair>
                <KVPair name={'Cited by count'}>{node.info.cited_by_count}</KVPair>
                <KVPair name={'Paper count'}>{node.info.document_count}</KVPair>
                <NodeInfos node={node} />
            </div>
        )
    }

    if (node.type === 'topic') {
        return (
            <div className="node-details">
                <h1>Topic details</h1>
                <KVPair name={'Name'}>{node.key}</KVPair>
                <NodeInfos node={node} />
            </div>
        )
    }

    return null
}

export default function Visualize(props) {
    const { py, isPyReady } = useAppContext()
    const router = useRouter()
    const { id } = router.match.params

    const query = parseQuery(router.location.search)

    const [form] = Form.useForm()
    const initialValues = {
        connectedComponentCount: 1,
        colorNodeBy: 'metric',
        colorEdgeBy: 'type',
        metrics: Object.fromEntries(metricsOptions.map(m => [m.value, m.value == 'degree_centrality' ? 1 : 0]))
    }

    console.log(initialValues)

    const [params, setParams] = useState(initialValues)
    const [tip, setTip] = useState('Loading graph...')

    const [data, dataLoading] = useApi('get', `/article-list/${id}/graph/`, {
        processData: formatArticleListGraphResponse
    })

    const [graph, graphLoading] = useAsyncMemo(async () => {
        const { nodes, edges, removeIsolates } = query
        if (!isPyReady) {
            setTip('Initializing Python...')
            return
        }

        if (!data) {
            setTip('Downloading data...')
            return
        }

        setTip('Loading graph into NetworkX...')
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
        //     setTip('Generationg nodes of type', node)
        //     await py.add_nodes_of_type(node)
        // }

        for (const edge of addEdges) {
            console.log('add edge', edge)
            setTip('Generating edges of type', edge, '...')

            if (edgeCreateIgnore.includes(edge)) {
                console.log('Skipping', edge)
                continue
            }
            await py.add_edges_of_type(edge)
        }

        for (const node of removeNodes) {
            console.log('remove node', node)
            setTip('Removing nodes of type', node, '...')
            await py.remove_nodes_of_type(node)
        }

        for (const edge of removeEdges) {
            console.log('remove edge', edge)
            setTip('Removing edges of type', edge, '...')
            await py.remove_edges_of_type(edge)
        }

        if (removeIsolates) {
            console.log('remove isolates')
            setTip('Removing isolates...')
            const isolateCount = await py.count_isolates()
            await py.remove_isolates()
            console.log(`removed ${isolateCount} isolates`)
            // setTip(`Removed ${isolateCount} isolates`)
        }

        console.log('finding connected components')
        setTip('Finding connected components...')
        await py.add_connected_component_attr()

        console.log('adding degrees')
        setTip('Calculating degrees...')
        await py.add_degree_attrs()

        console.log('adding metrics')
        setTip('Calculating metrics...')
        await py.add_metric_attrs()

        setTip('The graph is ready for visualization!')
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

    const [currentNode, setCurrentNode] = useState()
    const [componentFocused, setComponentFocused] = useState()

    const onClickNode = useCallback(node => {
        setCurrentNode(node)
    }, [])

    const canRender = isPyReady && !dataLoading && graph && !graphLoading

    const onFocusComponent = useCallback(
        comp => () => {
            setComponentFocused(comp)
        },
        []
    )

    const graphRef = useRef()
    const onZoomToFit = useCallback(() => {
        // console.log(graphRef);
        graphRef.current.zoomToFit(400)
    }, [graphRef])

    if (!canRender) {
        return <LoadingPage tip={tip} />
    }

    return (
        <div className="visualize">
            <div className="graph">
                <Graph
                    ref={graphRef}
                    graph={graph}
                    params={params}
                    onClickNode={onClickNode}
                    componentFocused={componentFocused}
                />
            </div>
            <div className="side">
                {currentNode !== undefined && currentNode.component !== componentFocused && (
                    <Button onClick={onFocusComponent(currentNode.component)}>Focus on connected component</Button>
                )}
                {componentFocused !== undefined && <Button onClick={onFocusComponent()}>Focus on entire graph</Button>}
                <Button onClick={onZoomToFit}>Zoom to Fit</Button>
                <NodeDetails node={currentNode} />
                <div>
                    <h1>Graph visualization</h1>
                    <Form form={form} {...formItemLayout} preserve onFinish={setParams} initialValues={initialValues}>
                        {/* Connected components
                        <Form.Item name={'connectedComponentCount'} label="Top Conn. Comps">
                            <Slider
                                min={1}
                                // max={graph?.connectedComponentCount ?? 10}
                                max={10}
                                // value={Math.min(_connectedComponentCount, graph.connectedComponentCount)}
                                // onChange={setConnectedComponentCount}
                            />
                        </Form.Item> */}
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
