import './dataset.less'

import { Button, Table } from 'antd'

import StatusTag from '../comp/StatusTag'
import { useApi, useRouter } from '../hooks'

const columns = [
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            return <StatusTag type={'article'} status={status} />
        }
    },
    {
        title: 'ID',
        dataIndex: 'id',
        key: 'id'
    },
    {
        title: 'DOI',
        dataIndex: 'doi',
        key: 'doi'
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title'
    },
    {
        title: 'Created at',
        dataIndex: 'created_date',
        key: 'created_date'
    },
    {
        title: 'Fetched at',
        dataIndex: 'fetched_date',
        key: 'fetched_date'
    },
    {
        title: 'Tries',
        dataIndex: 'try_count',
        key: 'try_count'
    }
]

export default function Dataset(props) {
    const router = useRouter()

    const [dataset, loading] = useApi('get', `/article-list/${router.match.params.id}`)

    const onClickVisualize = () => {
        router.push(`/configure/${router.match.params.id}`)
    }

    return (
        <div>
            <div className="dataset-pretable">
                <div className="dataset-pretable-buttons">
                    <Button onClick={onClickVisualize} type="primary">
                        Visualize
                    </Button>
                </div>
            </div>
            <h1>{dataset?.title ?? 'Loading...'}</h1>
            <Table loading={loading} dataSource={dataset} columns={columns} id={'id'}></Table>
        </div>
    )
}
