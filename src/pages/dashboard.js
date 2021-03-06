import './dashboard.less'

import { InboxOutlined } from '@ant-design/icons'
import FileReader from '@tanker/file-reader'
import { Button, Form, Input, Modal, PageHeader, Table, Upload } from 'antd'
import { useState } from 'react'

import StatusTag from '../comp/StatusTag'
import { useShow } from '../hooks'
import { useApi, useRouter } from '../hooks'
import { callApi, etv, formatArticleListsResponse, parseDoiList, renderDateToNow } from '../utils'

const { Dragger } = Upload

const columns = ({ onDeleteClicked, onVisualizeClicked, deleteLoading = false } = {}) => [
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            return <StatusTag type={'article_list'} status={status} />
        }
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title'
    },
    // {
    //     title: 'Owner',
    //     dataIndex: 'owner',
    //     key: 'owner'
    // },
    {
        title: 'Articles',
        dataIndex: 'number_of_articles',
        key: 'articles'
    },
    {
        title: 'Created at',
        dataIndex: 'created_date',
        key: 'created_date',
        render: renderDateToNow
    },
    {
        title: 'Actions',
        key: 'actions',
        render: row => {
            return (
                <div style={{ display: 'flex', gap: 16 }}>
                    <Button type="primary" onClick={etv(onVisualizeClicked(row.id))}>
                        Visualize
                    </Button>
                    <Button danger loading={deleteLoading} onClick={etv(onDeleteClicked(row.id))}>
                        Delete
                    </Button>
                </div>
            )
        }
    }
]

export function CreateDOIListModal({ onOk, onCancel }) {
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState(undefined)
    const [title, setTitle] = useState(undefined)

    const uploadProps = {
        name: 'file',
        beforeUpload: () => false,
        maxCount: 1,
        async onChange({ file }) {
            const reader = new FileReader(file)
            const text = await reader.readAsText('UTF-8')
            const doiList = parseDoiList(text)
            setList(doiList)
        }
    }

    const ready = list !== undefined && list.length && title && title.length >= 3

    const _onOk = async () => {
        await callApi('post', '/article-list/create/', {
            setLoading,
            data: {
                title,
                doi_list: list
            }
        })
        onOk()
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
            <Form.Item label="Title">
                <Input value={title} onChange={etv(setTitle)} />
            </Form.Item>
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
            {list && list.length && <p>You are about to upload {list.length} DOIs</p>}
            {list && list.length && (
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
    const router = useRouter()

    const [deleteLoading, setDeleteLoading] = useState(false)

    const [data, loading, refresh] = useApi('get', '/article-lists/', {
        processData: formatArticleListsResponse
    })

    const [visible, show, hide] = useShow(false)

    const onOk = () => {
        refresh()
        hide()
    }

    const onDoiListClick = doiList => event => {
        router.push(`/dataset/${doiList.id}`)
    }

    const onDeleteClicked = id => async () => {
        await callApi('delete', `/article-list/${id}/delete/`, {
            failThrough: true,
            setLoading: setDeleteLoading
        })
        refresh()
    }

    const onVisualizeClicked = id => () => {
        router.push(`/configure/${id}`)
    }

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subTitle="Here you can find all your submitted article lists"
                extra={[
                    <Button key="1" onClick={refresh}>
                        Refresh
                    </Button>,
                    <Button key="2" type="primary" onClick={show}>
                        Create
                    </Button>
                ]}
            />
            <Table
                loading={loading}
                onRow={record => {
                    return {
                        onClick: onDoiListClick(record), // click row
                        style: { cursor: 'pointer' }
                    }
                }}
                dataSource={data}
                columns={columns({ onDeleteClicked, onVisualizeClicked, deleteLoading })}
                id={'id'}
            ></Table>
            {visible && <CreateDOIListModal onOk={onOk} onCancel={hide} />}
        </div>
    )
}
