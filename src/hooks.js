import { notification } from 'antd'
import queryString from 'query-string'
import { useMemo, useCallback, useEffect, useState } from 'react'
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom'

import api from './api'
import { identity, nop } from './utils'

export function useApi(
    type,
    url,
    {
        showErrorNotification = true,
        showSuccessNotification = true,
        // processData = identity,
        processData = data => data.result,
        successNotification = 'Fetched data successfully',
        errorNotification = 'Failed to fetch',
        deps = []
    } = {}
) {
    const [refreshId, setRefreshId] = useState(0)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState()
    const refresh = useCallback(() => setRefreshId(x => x + 1), [])

    useEffect(() => {
        async function fn() {
            try {
                setLoading(true)
                const { data } = await api[type](url)
                setData(processData(data))
                if (showSuccessNotification) {
                    notification.success({ description: successNotification })
                }
            } catch (error) {
                if (showErrorNotification) {
                    notification.error({ description: errorNotification })
                }
            } finally {
                setLoading(false)
            }
        }

        fn()
    }, [...deps, refreshId])

    return [data, loading, refresh]
}

export function useDebouncedState(initValue, delay = 1000) {
    // State and setters for debounced value
    const [value, setValue] = useState(initValue)
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        // Update debounced value after delay
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        // Cancel the timeout if value changes (also on delay change or unmount)
        // This is how we prevent debounced value from updating if value is changed ...
        // .. within the delay period. Timeout gets cleared and restarted.
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return [debouncedValue, setValue, value]
}

export function useShow(initialValue = false) {
    const [val, setVal] = useState(initialValue)

    const hide = useCallback(() => setVal(false), [])
    const show = useCallback(() => setVal(true), [])
    const toggle = useCallback(() => setVal(v => !v), [])

    return [val, show, hide, toggle]
}

export function useRouter() {
    const params = useParams()

    const location = useLocation()
    const history = useHistory()
    const match = useRouteMatch()
    // Return our custom router object
    // Memoize so that a new object is only returned if something changes
    return useMemo(() => {
        return {
            // For convenience add push(), replace(), pathname at top level
            push: history.push,
            replace: history.replace,
            pathname: location.pathname,
            // Merge params and parsed query string into single "query" object
            // so that they can be used interchangeably.
            // Example: /:topic?sort=popular -> { topic: "react", sort: "popular" }
            query: location.search,
            parsedQuery: {
                ...queryString.parse(location.search), // Convert string to object
                ...params
            },
            // Include match, location, history objects so we have
            // access to extra React Router functionality if needed.
            match,
            location,
            history
        }
    }, [params, match, location, history])
}

export function useAsyncMemo(factory, deps, initial): T {
    const [loading, setLoading] = useState(true)
    const [val, setVal] = useState(initial)

    useEffect(() => {
        let cancel = false

        const promise = factory()

        if (promise === undefined || promise === null) {
            setLoading(false)
            return
        }

        setLoading(true)
        promise
            .then(val => {
                setLoading(false)
                if (!cancel) {
                    setVal(val)
                }
            })
            .catch(err => {
                setLoading(false)
                throw err
            })

        return () => {
            cancel = true
        }
    }, deps)

    return [val, loading]
}

export function useSet(initialSet) {
    const [set, setSet] = useState(initialSet)

    const stableActions = useMemo(() => {
        const add = item => setSet(prevSet => new Set([...Array.from(prevSet), item]))
        const set = items => setSet(new Set(items))
        const update = items => setSet(prevSet => new Set([...Array.from(prevSet), ...items]))
        const remove = item => setSet(prevSet => new Set(Array.from(prevSet).filter(i => i !== item)))
        const toggle = item =>
            setSet(prevSet =>
                prevSet.has(item)
                    ? new Set(Array.from(prevSet).filter(i => i !== item))
                    : new Set([...Array.from(prevSet), item])
            )

        return { add, set, update, remove, toggle, reset: () => setSet(initialSet) }
    }, [setSet])

    const utils = {
        has: useCallback(item => set.has(item), [set]),
        ...stableActions
    }

    return [set, utils]
}
