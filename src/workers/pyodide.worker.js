importScripts('https://cdn.jsdelivr.net/pyodide/v0.17.0/full/pyodide.js')

// let app
export async function init_pyodide() {
    await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.17.0/full/' })
    await pyodide.loadPackage(['scipy', 'networkx'])
}

export async function load_app(main_py) {
    await pyodide.runPython(main_py)
    app = pyodide.globals.get('app')
}

function toJs(obj) {
    function _1(obj) {
        if (pyodide.isPyProxy(obj)) {
            return obj.toJs()
        }

        return obj
    }

    function _2(obj) {
        if (obj instanceof Map) {
            let _obj = {}
            for (let [key, value] of obj.entries()) {
                _obj[key] = _2(value)
            }
            return _obj
        }

        if (obj instanceof Array) {
            return obj.map(e => _2(e))
        }

        if (obj instanceof Set) {
            return new Set([...obj].map(e => _2(e)))
        }

        return obj
    }

    function safelyDestroy(x) {
        if (!x) return

        if (typeof x === 'string') return

        if (pyodide.isPyProxy(x)) {
            x.destroy()
            return
        }

        if (!(x instanceof String) && x[Symbol.iterator]) {
            console.log(x)
            for (let k of x) {
                safelyDestroy(k)
            }
        }
    }

    let _obj = _1(obj)

    safelyDestroy(obj)

    _obj = _2(_obj)

    return _obj
}

let app

export async function load_graph(graph_json) {
    app.load_graph(pyodide.toPy(graph_json))
}

export async function get_nodes() {
    return toJs(app.get_nodes())
}

export async function get_edges() {
    return toJs(app.get_edges())
}

export async function get_node_types() {
    return toJs(app.get_node_types())
}

export async function get_edge_types() {
    return toJs(app.get_edge_types())
}

export async function get_graph() {
    return toJs(app.get_graph())
}

export async function remove_nodes_of_type(node_type) {
    app.remove_nodes_of_type(node_type)
}

export async function remove_edges_of_type(edge_type) {
    app.remove_edges_of_type(edge_type)
}

export async function add_edges_of_type(edge_type) {
    app.add_edges_of_type(edge_type)
}

export async function count_isolates() {
    return app.count_isolates()
}

export async function remove_isolates() {
    app.remove_isolates()
}

export async function get_info() {
    return toJs(app.get_info())
}

export async function get_connected_components_info() {
    return toJs(app.get_connected_components_info())
}

export async function get_number_connected_components() {
    return app.get_number_connected_components()
}

export async function add_connected_component_attr() {
    app.add_connected_component_attr()
}

export async function get_size_of_connected_components() {
    return toJs(app.get_size_of_connected_components())
}

export async function get_subgraph_of_connected_components(cnns) {
    return toJs(app.get_subgraph_of_connected_components(cnns))
}

export async function add_metric_attrs() {
    app.add_metric_attrs()
}

export async function add_degree_attrs() {
    app.add_degree_attrs()
}

// export async function add_layout_attr() {
//     app.add_layout_attr()
// }

// export async function layout() {
//     return toJs(app.layout())
// }

// export async function getMemoryUsage() {
//     return app.get_memory_usage()
// }
