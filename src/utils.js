import { notification } from 'antd'
import { formatDistanceToNow, isValid } from 'date-fns'
import doiRegex from 'doi-regex'

import api from './api'

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function parseDoiList(text) {
    return text.match(doiRegex())
}

export function shuffle(arr) {
    return [...arr].reduceRight((res, _, __, s) => (res.push(s.splice(0 | (Math.random() * s.length), 1)[0]), res), [])
}

export const constraints = {
    author_of: ['article', 'author'],
    topic_of: ['article', 'topic'],
    coauthor: ['author'],
    author_cotopic: ['author'],
    article_cotopic: ['article']
}

export const edgeCreateIgnore = ['author_of', 'topic_of']

export const edgeCreationOrder = ['author_of', 'topic_of', 'coauthor', 'author_cotopic', 'article_cotopic']

export const edgeSatisfiesConstraints = (edge, nodes) => {
    return constraints[edge].every(node => nodes.includes(node))
}

export const nodeOptions = [
    { label: 'Article', value: 'article' },
    { label: 'Author', value: 'author' },
    { label: 'Topic', value: 'topic' }
]

export const edgeOptions = [
    { value: 'author_of', label: 'Author of' },
    { value: 'topic_of', label: 'Topic of' },
    { value: 'coauthor', label: 'Coauthor' },
    { value: 'author_cotopic', label: 'Cotopic (Author)' },
    { value: 'article_cotopic', label: 'Cotopic (Article)' }
]

export function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start
        start = 0
    }

    if (typeof step == 'undefined') {
        step = 1
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return []
    }

    var result = []
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i)
    }

    return result
}

export function getRange(arr) {
    return [Math.min(...arr), Math.max(...arr)]
}

export const nop = () => {}
export const identity = x => x

export async function callApi(
    type,
    url,
    {
        failThrough = false,
        data = undefined,
        setLoading = nop,
        showErrorNotification = true,
        showSuccessNotification = true,
        successNotification = 'Changes are saved',
        errorNotification = 'Failed to save changes'
    } = {}
) {
    try {
        setLoading(true)
        await api[type](url, data)
        if (showSuccessNotification) {
            notification.success({ description: successNotification })
        }
    } catch (error) {
        if (showErrorNotification) {
            notification.error({ description: errorNotification })
        }

        if (failThrough) {
            setLoading(false)
            throw error
        }
    } finally {
        setLoading(false)
    }
}

export const etv = fn => event => fn(event.target.value)

export const statusMappings = {
    article_list: {
        phase_1: {
            displayName: 'Phase 1',
            color: 'cyan'
        },
        phase_2: {
            displayName: 'Phase 2',
            color: 'blue'
        },
        done: {
            displayName: 'Done',
            color: 'green'
        }
    },
    article: {
        to_be_fetched: {
            displayName: 'Fetching',
            color: 'cyan'
        },
        to_be_processed: {
            displayName: 'Processing',
            color: 'blue'
        },
        done: {
            displayName: 'Done',
            color: 'green'
        }
    }
}

export function formatArticleListResponse(r) {
    r = r.result
    r.forEach(a => {
        a.title = a.title === '' ? null : a.title
        a.created_date = newDateOrKeep(a.created_date)
        a.fetched_date = newDateOrKeep(a.fetched_date)
        a.processed_date = newDateOrKeep(a.processed_date)
    })
    return r
}

export function newDateOrKeep(d) {
    if (d === null || d === undefined) {
        return d
    }
    return new Date(d)
}

export function renderDateToNow(d) {
    if (d === null || d === undefined) {
        return 'Missing date'
    }

    if (!isValid(d)) {
        return 'Missing/Invalid date'
    }

    return formatDistanceToNow(d)
}

export function returnOr(x, s = 'Missing') {
    return x ?? s
}
