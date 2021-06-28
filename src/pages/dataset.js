import './dataset.less'

import { Button, PageHeader, Table } from 'antd'
import { useMemo } from 'react'

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
    // {
    //     title: 'ID',
    //     dataIndex: 'id',
    //     key: 'id',
    //     render: returnOr
    // },
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
        title: 'Published at',
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
    }
    // {
    //     title: 'Tries',
    //     dataIndex: 'try_count',
    //     key: 'try_count',
    //     render: returnOr
    // }
]

export default function Dataset(props) {
    const router = useRouter()
    const id = router.match.params.id

    const [dataset, loading, refresh] = useApi('get', `/article-list/${id}`, {
        processData: formatArticleListResponse
    })

    const [fetchCount, processingCount, doneCount] = useMemo(() => {
        if (!dataset) {
            return []
        }

        let fetchCount = 0
        let processingCount = 0
        let doneCount = 0

        for (let article of dataset) {
            fetchCount += article.status == 'to_be_fetched'
            processingCount += article.status == 'to_be_processed'
            doneCount += article.status == 'done'
        }

        return [fetchCount, processingCount, doneCount]
    }, [dataset])

    console.log(dataset)

    const onClickVisualize = () => {
        router.push(`/configure/${id}`)
    }

    return (
        <div>
            <PageHeader
                title={`Article list ${dataset?.title ?? ''}`}
                subTitle={
                    <div>
                        Here you can find the articles of this list
                        <br />
                        {fetchCount} <StatusTag type={'article'} status={'to_be_fetched'} /> 
                        {processingCount} <StatusTag type={'article'} status={'to_be_processed'} /> 
                        {doneCount} <StatusTag type={'article'} status={'done'} /> 
                    </div>
                }
                onBack={() => router.history.push('/dashboard')}
                extra={[
                    <Button key="2" onClick={refresh}>
                        Refresh
                    </Button>,
                    <Button
                        disabled={fetchCount !== 0 && processingCount !== 0}
                        key="1"
                        type="primary"
                        onClick={onClickVisualize}
                    >
                        Visualize
                    </Button>
                ]}
            />
            <h1>{loading ? 'Loading...' : dataset?.title ?? 'Article List'}</h1>
            <Table loading={loading} dataSource={dataset} columns={columns} id={'id'}></Table>
        </div>
    )
}
