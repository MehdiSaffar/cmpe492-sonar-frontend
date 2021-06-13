import './Layout_common.less'

import { Layout } from 'antd'

import { Content } from './Content'
import { Header } from './Header'

export const MainLayout = props => {
    return (
        <Layout>
            <Header />
            <Content {...props} />
        </Layout>
    )
}
