import { useEffect, useState } from 'react'

export default function ConditionallyRender(props) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => setIsMounted(true), [])

    if (!isMounted && props.client) return null
    if (isMounted && props.server) return null

    return props.children
}
