import './configure.less'

import { Button, Checkbox, PageHeader } from 'antd'
import qs from 'query-string'
import React, { useState } from 'react'

import api from '../api'
import { useAppContext } from '../context/AppContext'
import { useRouter } from '../hooks'
import { edgeOptions, edgeSatisfiesConstraints, nodeOptions } from '../utils'

export default function Configure(props, b, c) {
    const { isPyReady, py } = useAppContext()
    const router = useRouter()
    const id = router.match.params.id

    const [nodes, setNodes] = useState(['article', 'author', 'topic'])
    const [edges, setEdges] = useState(['author_of', 'topic_of', 'coauthor'])
    const [removeIsolates, setRemoveIsolates] = useState(false)

    const onNodeChange = nodes => {
        const newEdges = edges.filter(edge => edgeSatisfiesConstraints(edge, nodes))
        console.log(newEdges)
        setEdges(newEdges)
        setNodes(nodes)
    }

    const onEdgeChange = setEdges

    const processEdges = edgeOptions => {
        return edgeOptions.map(edge => {
            const disabled = !edgeSatisfiesConstraints(edge.value, nodes)
            return { ...edge, disabled }
        })
    }

    const nodeCheckbox = <Checkbox.Group value={nodes} options={nodeOptions} onChange={onNodeChange} />
    const edgeCheckbox = <Checkbox.Group value={edges} options={processEdges(edgeOptions)} onChange={onEdgeChange} />
    const removeIsolatesCheckbox = (
        <Checkbox checked={removeIsolates} onChange={e => setRemoveIsolates(e.target.checked)}>
            Remove isolates
        </Checkbox>
    )

    const canSubmit = nodes.length >= 1

    const onVisualize = () => {
        const query = {
            nodes,
            edges,
            removeIsolates
        }

        const queryString = qs.stringify(query, {
            arrayFormat: 'bracket-separator',
            arrayFormatSeparator: ',',
            skipNull: true,
            skipEmptyString: true
        })

        router.push(`/visualize/${id}/?${queryString}`)
    }

    return (
        <div className="configure">
            <PageHeader
                title={`Configure graph of article list ${id}`}
                subTitle="Select the nodes and edges for the visualization"
                onBack={() => router.history.push(`/dataset/${id}`)}
                extra={[
                    <Button key="1" type="primary" disabled={!canSubmit} onClick={onVisualize}>
                        Visualize
                    </Button>
                ]}
            />
            <div className="configure-content">
                <br />
                Please select the nodes and edges you would like to visualize <br />
                <br />
                <b>Nodes:</b>
                <br />
                {nodeCheckbox}
                <br />
                <br />
                <b>Edges:</b>
                <br />
                {edgeCheckbox}
                <br />
                <br />
                Extra:
                <br />
                {removeIsolatesCheckbox}
                <br />
                <br />
                <Button disabled={!canSubmit} type="primary" onClick={onVisualize}>
                    Visualize
                </Button>
            </div>
        </div>
    )
}
