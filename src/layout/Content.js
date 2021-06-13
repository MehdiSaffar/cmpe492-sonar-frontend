import './Layout_common.less'

import { Layout } from 'antd'
import cls from 'classnames'
// import { useRouter } from 'next/router'

export const Content = props => {
    // return null
    // const router = useRouter()

    // className={cls('layout-content', {
    //     'layout-content-padded': !router.pathname.startsWith('/visualize')
    // })}
    return <Layout.Content>{props.children}</Layout.Content>
}
