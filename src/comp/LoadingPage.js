import './LoadingPage.less'

import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'

export default function LoadingPage(props) {
    return (
        <Spin
            className="loading-page"
            tip={'Loading...'}
            size="large"
            indicator={<LoadingOutlined style={{ fontSize: 42 }} spin />}
            spinning={true}
            {...props}
        />
    )
}
