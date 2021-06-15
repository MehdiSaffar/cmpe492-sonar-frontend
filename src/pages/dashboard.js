import './dashboard.less'

import { InboxOutlined } from '@ant-design/icons'
import FileReader from '@tanker/file-reader'
import { Button, Form, Input, Modal, notification, Table, Tag, Upload } from 'antd'
// import router from 'next/router'
import { useEffect, useState } from 'react'

import api from '../api'
import StatusTag from '../comp/StatusTag'
import { useShow } from '../hooks'
import { useApi, useRouter } from '../hooks'
import { callApi, etv, parseDoiList, sleep } from '../utils'

const { Dragger } = Upload

const columns = ({ onDeleteClicked, deleteLoading = false } = {}) => [
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
        render: row => {
            return (
                <div>
                    <Button danger loading={deleteLoading} onClick={onDeleteClicked(row.id)}>
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
        processData: data => data.result
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
                loading={loading}
                onRow={record => {
                    return {
                        onClick: onDoiListClick(record) // click row
                    }
                }}
                dataSource={data}
                columns={columns({ onDeleteClicked, deleteLoading })}
                id={'id'}
            ></Table>
            {visible && <CreateDOIListModal onOk={onOk} onCancel={hide} />}
        </div>
    )
}
