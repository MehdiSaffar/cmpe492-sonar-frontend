// import './dataset.less'

import { Button, Table } from 'antd'

// import router from 'next/router'
import StatusTag from '../comp/StatusTag'

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
        title: 'Date',
        dataIndex: 'date',
        key: 'date'
    }
]

export default function Dataset(props) {
    const { dataset } = props

    const onClickVisualize = () => {
        // router.push('/visualize')
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
            <h1>{dataset.title}</h1>
            <Table dataSource={dataset.articles} columns={columns} id={'id'}></Table>
        </div>
    )
}

// Dataset.getInitialProps = () => {
//     return {
//         dataset: {
//             id: 1,
//             status: 'processing',
//             title: 'Articles on Biology',
//             owner: 'Mehdi Saffar',
//             articles: [
//                 {
//                     id: 1,
//                     doi: '10.1038/s41467-019-13850-7',
//                     title: 'Computer science: an overview',
//                     status: 'ready',
//                     date: new Date('12/03/2021')
//                 },
//                 {
//                     id: 2,
//                     doi: '10.1038/s41467-019-13850-7',
//                     title: 'Scientific methods in computer science',
//                     status: 'processing',
//                     date: new Date('11/03/2021')
//                 }
//             ]
//         }
//     }
// }
