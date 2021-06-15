import './Layout_common.less'

import { Layout } from 'antd'
import cls from 'classnames'

import { useRouter } from '../hooks'

export const Content = props => {
    // return null
    const router = useRouter()

    return (
        <Layout.Content
            className={cls('layout-content', {
                'layout-content-padded': !router.pathname.startsWith('/visualize')
            })}
        >
            {props.children}
        </Layout.Content>
    )
}
