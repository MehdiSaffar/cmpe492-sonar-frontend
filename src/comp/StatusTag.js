import { Tag } from 'antd'
import React from 'react'

import { statusMappings } from '../utils'

export default function StatusTag({ type, status }) {
    const _type = statusMappings[type] ?? {}
    const _props = _type[status] ?? { color: 'gray', displayName: status }

    return <Tag color={_props.color}>{_props.displayName}</Tag>
}
