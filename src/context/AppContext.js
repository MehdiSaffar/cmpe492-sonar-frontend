import constate from 'constate'
import { useState } from 'react'

import api from '../api'
import graph_json from '../assets/graph.small.json'
import { edgeCreateIgnore, edgeCreationOrder, edgeOptions, nodeOptions } from '../utils'

const guestUser = { type: 'guest' }
const customerUser = {
    type: 'customer',
    id: '3',
    name: 'Mehdi',
    surname: 'Saffar',
    email: 'example@gmail.com',
    role: '1',
    is_verified: false
}

function useApp() {
    // const { user, loading: userLoading, error: userError } = useUser()

    const [user, setUser] = useState(guestUser)
    const [py, setPy] = useState()
    const [isPyReady, setIsPyReady] = useState(false)
    const [graph, setGraph] = useState()
    const [isGraphReady, setIsGraphReady] = useState(false)

    const loadGraph = async ({ nodes, edges, removeIsolates }) => {
        // setMsg('Fetching graph data')
        console.log('graph_json')
        // const { data } = await api.get('/graph')
        const data = graph_json
        console.log('data', data)

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

        setGraph({
            nodes: await py.get_nodes(),
            edges: await py.get_edges(),
            connectedComponentCount: await py.get_number_connected_components(),
            components: await py.get_connected_components_info()
        })
    }

    return {
        user,
        graph,

        py,

        isGraphReady,
        isPyReady,

        loadGraph,

        setGraph,
        setIsGraphReady,
        setIsPyReady,
        setPy
    }
}

export const [AppContextProvider, useAppContext] = constate(useApp)
