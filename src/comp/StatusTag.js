import { Tag } from 'antd'
import React from 'react'

const color = {
    processing: 'blue',
    ready: 'green',
    failed: 'red',
    fetching: 'cyan'
}

export default function StatusTag({ status }) {
    return <Tag color={color[status]}>{status}</Tag>
}
