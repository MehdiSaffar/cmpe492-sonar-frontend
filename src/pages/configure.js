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

    // if (!isPyReady) {
    //     return <div>Please wait until Python is ready</div>
    // }

    const [nodes, setNodes] = useState([])
    const [edges, setEdges] = useState([])
    const [removeIsolates, setRemoveIsolates] = useState(false)

    const [state, setState] = useState('config')
    const [msg, setMsg] = useState('')

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

    const nodeCheckbox = (
        <Checkbox.Group value={nodes} disabled={state != 'config'} options={nodeOptions} onChange={onNodeChange} />
    )
    const edgeCheckbox = (
        <Checkbox.Group
            value={edges}
            disabled={state != 'config'}
            options={processEdges(edgeOptions)}
            onChange={onEdgeChange}
        />
    )
    const removeIsolatesCheckbox = (
        <Checkbox checked={removeIsolates} onChange={e => setRemoveIsolates(e.target.checked)}>
            Remove isolates
        </Checkbox>
    )

    const canSubmit = nodes.length >= 1

    const onConfirm = () => {
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
                subTitle="Here you can find the articles of this list"
                onBack={router.history.goBack}
                extra={[
                    <Button key="1" type="primary" disabled={!(isPyReady && canSubmit)} onClick={onConfirm}>
                        Visualize
                    </Button>
                ]}
            />
            {state}
            <br />
            Please select the nodes and edges you would like to visualize <br />
            <br />
            Nodes:
            <br />
            {nodeCheckbox}
            <br />
            <br />
            Edges:
            <br />
            {edgeCheckbox}
            <br />
            <br />
            {removeIsolatesCheckbox}
            <br />
            <br />
            <Button disabled={!(isPyReady && canSubmit)} type="primary" onClick={onConfirm}>
                Confirm
            </Button>
        </div>
    )
}
