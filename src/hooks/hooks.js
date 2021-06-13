import queryString from 'query-string'
import { useCallback, useEffect, useState } from 'react'
import { useMemo } from 'react'
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom'

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
