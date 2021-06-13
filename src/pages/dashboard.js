import './dashboard.less'

import { InboxOutlined } from '@ant-design/icons'
import FileReader from '@tanker/file-reader'
import { Button, Modal, notification, Table, Tag, Upload } from 'antd'
// import router from 'next/router'
import { useState } from 'react'

import StatusTag from '../comp/StatusTag'
import { useShow } from '../hooks/hooks'
import { parseDoiList, sleep } from '../utils'

const { Dragger } = Upload

const columns = [
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            return <StatusTag status={status} />
        }
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title'
    },
    {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner'
    },
    {
        title: 'Articles',
        dataIndex: 'articles',
        key: 'articles'
    },
    {
        title: 'Actions',
        key: 'actions',
        render: () => {
            return (
                <div>
                    <Button>Edit</Button>
                    <Button danger>Delete</Button>
                </div>
            )
        }
    }
]

export function CreateDOIListModal({ onOk, onCancel }) {
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState(undefined)

    const uploadProps = {
        name: 'file',
        maxCount: 1,
        async onChange(info) {
            if (!info.file) return

            if (info.file.status === 'done') {
                console.log('info', info)
                const reader = new FileReader(info.file.originFileObj)
                const text = await reader.readAsText('UTF-8')
                const doiList = parseDoiList(text)
                setList(doiList)
            }
        }
    }

    const ready = list !== undefined && list.length

    const _onOk = async () => {
        setLoading(true)
        try {
            await sleep(1000)
            notification.success({
                message: 'DOI list uploaded'
            })
            onOk()
        } catch (err) {
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            visible
            onOk={_onOk}
            onCancel={onCancel}
            okText="Upload"
            okButtonProps={{
                loading,
                disabled: !ready
            }}
        >
            <Dragger {...uploadProps} className="doi-list-upload">
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Drop a DOI list file to upload</p>
                <p className="ant-upload-hint">
                    Click on this drop area to select a file or drag and drop a file from the file explorer directly
                    here to upload
                </p>
            </Dragger>
            {list !== undefined && !list.length && (
                <p>You seem to have uploaded an empty file. We couldn't find any doi</p>
            )}
            {ready && <p>You are about to upload {list.length} DOIs</p>}
            {ready && (
                <ul className="doi-list-upload-list">
                    {list.map((doi, index) => {
                        return (
                            <li key={doi}>
                                <b>{index + 1}:</b> {doi}
                            </li>
                        )
                    })}
                </ul>
            )}
        </Modal>
    )
}

export default function Dashboard(props) {
    const { data } = props
    const [visible, show, hide] = useShow(false)

    const onDoiListClick = doiList => event => {
        // router.push(`/dataset?id=${doiList.id}`)
    }

    return (
        <div>
            <div className="dashboard-pretable">
                <div className="dashboard-pretable-buttons">
                    <Button onClick={show} type="primary">
                        Create
                    </Button>
                </div>
            </div>
            <Table
                onRow={(record, rowIndex) => {
                    return {
                        onClick: onDoiListClick(record) // click row
                    }
                }}
                dataSource={data}
                columns={columns}
                id={'id'}
            ></Table>
            {visible && <CreateDOIListModal onOk={hide} onCancel={hide} />}
        </div>
    )
}

Dashboard.getInitialProps = () => {
    const dataSource = [
        {
            id: 1,
            status: 'processing',
            title: 'Articles on Biology',
            owner: 'Mehdi Saffar',
            articles: 250
        },
        {
            id: 2,
            status: 'ready',
            title: 'Popular COVID papers',
            owner: 'Umut Oksuz',
            articles: 1542
        }
    ]

    return {
        data: dataSource
    }
}
