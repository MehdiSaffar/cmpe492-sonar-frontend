import './dataset.less'

import { Button, PageHeader, Table } from 'antd'

import StatusTag from '../comp/StatusTag'
import { useApi, useRouter } from '../hooks'
import { formatArticleListResponse, renderDateToNow, returnOr } from '../utils'

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
        key: 'id',
        render: returnOr
    },
    {
        title: 'DOI',
        dataIndex: 'doi',
        key: 'doi',
        render: returnOr
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: returnOr
    },
    {
        title: 'Created at',
        dataIndex: 'created_date',
        key: 'created_date',
        render: renderDateToNow
    },
    {
        title: 'Fetched at',
        dataIndex: 'fetched_date',
        key: 'fetched_date',
        render: renderDateToNow
    },
    {
        title: 'Processed at',
        dataIndex: 'processed_date',
        key: 'processed_date',
        render: renderDateToNow
    },
    {
        title: 'Tries',
        dataIndex: 'try_count',
        key: 'try_count',
        render: returnOr
    }
]

export default function Dataset(props) {
    const router = useRouter()
    const id = router.match.params.id

    const [dataset, loading, refresh] = useApi('get', `/article-list/${id}`, {
        processData: formatArticleListResponse
    })

    console.log(dataset)

    const onClickVisualize = () => {
        router.push(`/configure/${id}`)
    }

    return (
        <div>
            <PageHeader
                title={`Article list ${dataset?.title ?? ''}`}
                subTitle="Here you can find the articles of this list"
                onBack={router.history.goBack}
                extra={[
                    <Button key="2" onClick={refresh}>
                        Refresh
                    </Button>,
                    <Button key="1" type="primary" onClick={onClickVisualize}>
                        Visualize
                    </Button>
                ]}
            />
            <h1>{loading ? 'Loading...' : dataset?.title ?? 'Article List'}</h1>
            <Table loading={loading} dataSource={dataset} columns={columns} id={'id'}></Table>
        </div>
    )
}
