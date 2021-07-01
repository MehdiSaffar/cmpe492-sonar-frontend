import { notification } from 'antd'
import ColorHash from 'color-hash'
import { format, formatDistanceToNow, isValid } from 'date-fns'
import doiRegex from 'doi-regex'
import objectHash from 'object-hash'

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
            displayName: 'Preparing',
            color: 'cyan'
        },
        phase_2: {
            displayName: 'Preparing',
            color: 'cyan'
        },
        done: {
            displayName: 'Ready',
            color: 'green'
        }
    },
    article: {
        failed: {
            displayName: 'Failed',
            color: 'red'
        },
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

export function formatArticleListsResponse(r) {
    r = r.result
    r.forEach(l => {
        l.created_date = newDateOrKeep(l.created_date)
    })
    return r
}

export function formatArticleListResponse(r) {
    r = r.result
    r.articles.forEach(a => {
        a.title = a.title === '' ? null : a.title
        a.created_date = newDateOrKeep(a.created_date)
        a.fetched_date = newDateOrKeep(a.fetched_date)
        a.processed_date = newDateOrKeep(a.processed_date)
    })
    return r
}

export function formatArticleListGraphResponse(r) {
    r.nodes.forEach(n => {
        delete n.article_list

        const info = n.specific_information
        n.info = info
        delete n.specific_information

        const key = n.object_key
        n.key = key
        delete n.object_key

        const type = n.node_type
        n.type = type
        delete n.node_type

        if (n.type === 'article') {
            const cited_by_count = n.info['cited-by_count']
            n.info.cited_by_count = cited_by_count
            delete n.info['cited-by_count']

            n.created_date = newDateOrKeep(n.created_date)
        }
    })

    r.edges.forEach(e => {
        delete e.article_list

        const info = e.specific_information
        e.info = info
        delete e.specific_information

        const type = e.edge_type
        e.type = type
        delete e.edge_type
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

    return formatDistanceToNow(d, { addSuffix: ' ago' })
}

export function returnOr(x, s = 'Missing') {
    return x ?? s
}

export function formatDate(date) {
    return format(date, 'dd/MM/yyyy')
}

const colorHash = new ColorHash()

export const getUniqueColor = o => {
    if (typeof o === 'string') {
        return colorHash.hex(o)
    }

    if (typeof o === 'number') {
        return colorHash.hex(o.toString())
    }

    return colorHash.hex(objectHash(o))
}

export function getDoiUrl(doi) {
    return `https://doi.org/${doi}`
}

export const nodeColorMap = {
    article: '#0000FF',
    author: '#FF0000',
    topic: '#696969'
}
