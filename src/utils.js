import doiRegex from 'doi-regex'

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
