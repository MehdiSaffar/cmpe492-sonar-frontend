import networkx as nx
import numpy as np
import networkx.readwrite
import itertools as it
import io
import pyodide
import json
import sys

chain = it.chain.from_iterable


class UnknownEdgeTypeException(Exception):
    def __init__(self, edge_type):
        self.edge_type = edge_type
        self.message = f'Unknown edge type {edge_type}'
        super().__init__(self.message)


def get_node_types(g):
    return set(node['type'] for _, node in g.nodes(data=True))


def get_edge_types(g):
    return set(edge['type'] for _, _, edge in g.edges(data=True))


def get_nodes_of_type(g, node_type):
    return [node for node, node_attr in g.nodes(data=True) if node_attr['type'] == node_type]


def get_edges_of_type(g, edge_type):
    return [(edge_src, edge_trg) for edge_src, edge_trg, edge_attr in g.edges(data=True) if edge_attr['type'] == edge_type]


def get_neighbor_nodes_of(g, node):
    return set(g.adj[node].keys())


def get_neighbor_nodes_of_type(g, node, node_type):
    nodes = set()
    for adj_node, adj_edge in g.adj[node].items():
        if g.nodes[adj_node]['type'] == node_type:
            nodes.add(adj_node)

    return nodes


def get_neighbor_nodes_along_edge_of_type(g, node, edge_type):
    nodes = set()
    for adj_node, adj_edge in g.adj[node].items():
        if g.edges[adj_edge]['type'] == edge_type:
            nodes.add(adj_node)

    return nodes


def get_neighbor_nodes_of_type_along_edge_of_type(g, node, edge_type, node_type):
    nodes = set()
    for adj_node, adj_edge in g.adj[node].items():
        if adj_edge['type'] == edge_type:
            if g.nodes[adj_node]['type'] == node_type:
                nodes.add(adj_node)

    return nodes


class App:
    def format_nodes_for_nx(self, nodes):
        _nodes = []

        for node in nodes:
            id = node['id']
            other = {k: v for k, v in node.items() if k not in ['id']}
            _nodes.append((id, node))

        return _nodes

    def format_edges_for_nx(self, edges):
        _edges = []

        for edge in edges:
            src = edge['from_node']
            trg = edge['to_node']
            other = {k: v for k, v in edge.items() if k not in ['from_node', 'to_node']}
            _edges.append((src, trg, other))

        return _edges

    def load_graph(self, js):
        self.g = nx.Graph()

        self.g.add_nodes_from(self.format_nodes_for_nx(js['nodes']))
        self.g.add_edges_from(self.format_edges_for_nx(js['edges']))

    def get_nodes(self):
        return list(self.g.nodes(data=True))

    def get_edges(self):
        return list(self.g.edges(data=True))

    def get_node_types(self):
        return list(get_node_types(self.g))

    def get_edge_types(self):
        return list(get_edge_types(self.g))

    def get_graph(self):
        return dict(
            nodes=self.get_nodes(),
            edges=self.get_edges()
        )

    def get_connected_components_info(self):
        ix = self.get_connected_components_index()
        size = self.get_size_of_connected_components()

        return dict(zip(ix, size))

    def add_metric_attrs(self, normalize_by_connected_component=True):
        switcher = {
            'degree_centrality': nx.degree_centrality,
            # 'eigenvector_centrality': nx.eigenvector_centrality,
            # 'closeness_centrality': nx.closeness_centrality,
            # 'betweenness_centrality': nx.betweenness_centrality,
            # 'communicability_centrality': nx.communicability_centrality,
            # 'load_centrality': nx.load_centrality,
            # 'subgraph_centrality': nx.subgraph_centrality,
            # 'harmonic_centrality': nx.harmonic_centrality,
            # 'voterank': nx.voterank,
        }

        values = {}

        cn_info = self.get_connected_components_info()

        for metric_key, metric_fn in switcher.items():
            values[metric_key] = metric_fn(self.g)

        for metric_key, metric_values in values.items():
            for metric_node, metric_value in metric_values.items():
                node = self.g.nodes[metric_node]

                node[metric_key] = metric_value
                if normalize_by_connected_component:
                    node[metric_key] /= cn_info[node['component']]

    def remove_nodes_of_type(self, node_type):
        self.g.remove_nodes_from(get_nodes_of_type(self.g, node_type))

    def remove_edges_of_type(self, edge_type):
        self.g.remove_edges_from(get_edges_of_type(self.g, edge_type))

    def add_edges_of_type(self, edge_type):
        switcher = {
            # 'author_of': lamdba
            # 'topic_of': lamdba
            'coauthor': self.add_author_coauthor_author_edges,
            'author_cotopic': self.add_author_cotopic_author_edges,
            'article_cotopic': self.add_article_cotopic_article_edges,
        }

        fn = switcher.get(edge_type)

        if fn is None:
            raise UnknownEdgeTypeException(edge_type=edge_type)

        fn()

    def add_author_coauthor_author_edges(self):
        edges = set()
        for node, node_data in self.g.nodes(data=True):
            if node_data['type'] == 'article':
                authors = get_neighbor_nodes_of_type_along_edge_of_type(self.g, node, 'author_of', 'author')
                edges.update(it.combinations(authors, 2))

        for edge in edges:
            self.g.add_edge(*edge, type='coauthor')

    def add_author_cotopic_author_edges(self):
        edges = set()
        for node, node_data in self.g.nodes(data=True):
            if node_data['type'] == 'topic':
                articles = get_neighbor_nodes_of_type_along_edge_of_type(self.g, node, 'topic_of', 'article')
                authors = set(chain(get_neighbor_nodes_of_type_along_edge_of_type(self.g, article, 'author_of', 'author') for article in articles))
                edges.update(it.combinations(authors, 2))

        for edge in edges:
            self.g.add_edge(*edge, type='author_cotopic')

    def add_article_cotopic_article_edges(self):
        edges = set()
        for node, node_data in self.g.nodes(data=True):
            if node_data['type'] == 'topic':
                articles = get_neighbor_nodes_of_type_along_edge_of_type(self.g, node, 'topic_of', 'article')
                edges.update(it.combinations(articles, 2))

        for edge in edges:
            self.g.add_edge(*edge, type='article_cotopic')

    def count_isolates(self):
        return len(list(nx.isolates(self.g)))

    def remove_isolates(self):
        self.g.remove_nodes_from(list(nx.isolates(self.g)))

    def get_info(self):
        return nx.info(self.g)

    def get_number_connected_components(self):
        return nx.number_connected_components(self.g)

    def get_connected_components_index(self):
        return list(range(len(self.get_connected_components())))

    def get_connected_components(self):
        return list(sorted(nx.connected_components(self.g), key=len, reverse=True))

    def get_size_of_connected_components(self):
        return [len(comp) for comp in self.get_connected_components()]

    def get_subgraph_of_connected_components(self, cnns):
        cnns = set(cnns)
        comps = self.get_connected_components()
        comps_ix = self.get_connected_components_index()

        nodes = list(chain(comp for comp_ix, comp in zip(comps_ix, comps) if comp_ix in cnns))
        graph = self.g.subgraph(nodes)

        return dict(
            nodes=list(graph.nodes(data=True)),
            edges=list(graph.edges(data=True))
        )

    def add_connected_component_attr(self):
        comps = self.get_connected_components()

        for comp_ix, comp in enumerate(comps):
            for node in comp:
                self.g.nodes[node]['component'] = comp_ix

    # def add_layout_attr(self):
    #     nodes = nx.spring_layout(self.g, dim=3)

    #     for node, (x, y, z) in nodes.items():
    #         self.g.nodes[node]['x'] = x
    #         self.g.nodes[node]['y'] = y
    #         self.g.nodes[node]['z'] = z

    # def layout(self):
    #     return nx.drawing.layout.spring_layout(self.g)

    # def get_memory_usage(self):
    #     return sys.getsizeof(self.G.edges(data=True)) + sys.getsizeof(self.G.nodes(data=True))

    # def get_adj(self):
    #     return nx.readwrite.json_graph.adjacency_data(self.G)


app = App()
