"""
graph.py - FalkorDB connection and Cypher tools for 'Who Knows What'
Track 03: Company Brain (Solo)
"""

import os
from typing import Any, Dict, List, Optional
from falkordb import FalkorDB

FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))
GRAPH_NAME = os.getenv("FALKORDB_GRAPH", "northstar")


class NorthstarGraph:
    def __init__(self, host: str = FALKORDB_HOST, port: int = FALKORDB_PORT, graph_name: str = GRAPH_NAME):
        self.host = host
        self.port = port
        self.graph_name = graph_name
        self._db: Optional[FalkorDB] = None
        self._graph = None

    def get_graph(self):
        if self._graph is None:
            self._db = FalkorDB(host=self.host, port=self.port)
            self._graph = self._db.select_graph(self.graph_name)
        return self._graph

    def run_query(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        graph = self.get_graph()
        result = graph.query(cypher, params or {})
        columns = result.header
        rows = []
        for raw_row in result.result_set:
            row_dict = {}
            for col, val in zip(columns, raw_row):
                if isinstance(col, (list, tuple)) and len(col) >= 2:
                    clean_col = str(col[1])
                elif isinstance(col, str):
                    clean_col = col.split(".")[-1]
                else:
                    clean_col = str(col)
                row_dict[clean_col] = val
            rows.append(row_dict)
        return rows

    # --- Tool 1: Who Knows System ---
    def who_knows_system(self, name: str) -> Dict[str, Any]:
        """
        Finds who owns or worked on a system, including indirect connections via projects.
        """
        cypher = """
        MATCH (p:Person)-[r:OWNS|WORKS_ON]->(s:System)
        WHERE toLower(s.name) CONTAINS toLower($name)
        RETURN DISTINCT p.name AS person, p.role AS role, p.email AS email, type(r) AS relationship, 'Direct Owner/Maintainer' AS connection, s.name AS system

        UNION

        MATCH (p:Person)-[:WORKS_ON]->(pr:Project)-[:USES]->(s:System)
        WHERE toLower(s.name) CONTAINS toLower($name)
        RETURN DISTINCT p.name AS person, p.role AS role, p.email AS email, 'WORKS_ON_PROJECT' AS relationship, pr.name AS connection, s.name AS system

        UNION

        MATCH (p:Person)-[r:WORKS_ON]->(pr:Project)
        WHERE toLower(pr.name) CONTAINS toLower($name)
        RETURN DISTINCT p.name AS person, p.role AS role, p.email AS email, type(r) AS relationship, 'Project Contributor' AS connection, pr.name AS system
        """
        rows = self.run_query(cypher, {"name": name})

        # Fetch representative graph paths for visual explanation
        paths = self.get_paths_for_entity(name)

        return {
            "tool": "who_knows_system",
            "query_param": name,
            "cypher": cypher.strip(),
            "count": len(rows),
            "rows": rows,
            "paths": paths
        }

    # --- Tool 2: Blast Radius ---
    def blast_radius(self, name: str) -> Dict[str, Any]:
        """
        Determines downstream dependencies, affected projects, and primary owners to ping if a service goes down.
        """
        cypher = """
        MATCH (down:System)
        WHERE toLower(down.name) CONTAINS toLower($name)
        OPTIONAL MATCH (other:System)-[:DEPENDS_ON]->(down)
        OPTIONAL MATCH (proj:Project)-[:USES]->(down)
        OPTIONAL MATCH (owner:Person)-[:OWNS]->(down)
        RETURN down.name AS down_system,
               down.criticality AS criticality,
               collect(DISTINCT other.name) AS systems_that_break,
               collect(DISTINCT proj.name) AS projects_affected,
               collect(DISTINCT owner.name) AS owners_to_ping
        """
        rows = self.run_query(cypher, {"name": name})
        paths = self.get_paths_for_entity(name)

        return {
            "tool": "blast_radius",
            "query_param": name,
            "cypher": cypher.strip(),
            "count": len(rows),
            "rows": rows,
            "paths": paths
        }

    # --- Tool 3: Decision About ---
    def decision_about(self, topic: str) -> Dict[str, Any]:
        """
        Finds architectural decisions, who made them, when, and their summary.
        """
        cypher = """
        MATCH (d:Decision)-[:ABOUT]->(x)
        WHERE toLower(d.title) CONTAINS toLower($topic)
           OR toLower(d.summary) CONTAINS toLower($topic)
           OR toLower(x.name) CONTAINS toLower($topic)
        OPTIONAL MATCH (d)-[:MADE_BY]->(p:Person)
        RETURN d.title AS title,
               d.decided_on AS decided_on,
               d.summary AS summary,
               p.name AS decided_by,
               p.role AS role,
               labels(x)[0] AS about_type,
               x.name AS about_target
        """
        rows = self.run_query(cypher, {"topic": topic})

        # Paths connecting Decision -> Person and Decision -> System/Project
        path_cypher = """
        MATCH path = (p:Person)<-[:MADE_BY]-(d:Decision)-[:ABOUT]->(x)
        WHERE toLower(d.title) CONTAINS toLower($topic)
           OR toLower(d.summary) CONTAINS toLower($topic)
           OR toLower(x.name) CONTAINS toLower($topic)
        RETURN [n IN nodes(path) | coalesce(n.name, n.title)] AS nodes,
               [r IN relationships(path) | type(r)] AS rels
        LIMIT 5
        """
        path_rows = self.run_query(path_cypher, {"topic": topic})
        paths = self._format_path_rows(path_rows)

        return {
            "tool": "decision_about",
            "query_param": topic,
            "cypher": cypher.strip(),
            "count": len(rows),
            "rows": rows,
            "paths": paths
        }

    # --- Tool 4: Open Tickets ---
    def open_tickets(self, name: str) -> Dict[str, Any]:
        """
        Finds open tickets related to a project, system, or keyword, and who is assigned to them.
        """
        cypher = """
        MATCH (t:Ticket)-[:ABOUT]->(x)
        WHERE toLower(t.status) = 'open'
          AND (toLower(x.name) CONTAINS toLower($name)
               OR toLower(t.title) CONTAINS toLower($name)
               OR toLower(t.key) CONTAINS toLower($name))
        OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(p:Person)
        RETURN t.key AS key,
               t.title AS title,
               t.status AS status,
               t.opened_on AS opened_on,
               labels(x)[0] AS target_type,
               x.name AS target_name,
               p.name AS assignee,
               p.role AS assignee_role
        ORDER BY t.opened_on DESC
        """
        rows = self.run_query(cypher, {"name": name})

        path_cypher = """
        MATCH path = (p:Person)<-[:ASSIGNED_TO]-(t:Ticket)-[:ABOUT]->(x)
        WHERE toLower(t.status) = 'open'
          AND (toLower(x.name) CONTAINS toLower($name)
               OR toLower(t.title) CONTAINS toLower($name)
               OR toLower(t.key) CONTAINS toLower($name))
        RETURN [n IN nodes(path) | coalesce(n.name, n.title, n.key)] AS nodes,
               [r IN relationships(path) | type(r)] AS rels
        LIMIT 5
        """
        path_rows = self.run_query(path_cypher, {"name": name})
        paths = self._format_path_rows(path_rows)

        return {
            "tool": "open_tickets",
            "query_param": name,
            "cypher": cypher.strip(),
            "count": len(rows),
            "rows": rows,
            "paths": paths
        }

    # --- Tool 5: Explain Path / Graph Explorer ---
    def get_paths_for_entity(self, name: str) -> List[str]:
        """
        Returns visual ASCII/markdown relationship paths around any entity.
        """
        cypher = """
        MATCH path = (p:Person)-[*1..2]-(target)
        WHERE toLower(target.name) CONTAINS toLower($name)
        RETURN [n IN nodes(path) | coalesce(n.name, n.title, n.key)] AS nodes,
               [r IN relationships(path) | type(r)] AS rels
        LIMIT 6
        """
        rows = self.run_query(cypher, {"name": name})
        return self._format_path_rows(rows)

    def _format_path_rows(self, rows: List[Dict[str, Any]]) -> List[str]:
        paths = []
        for r in rows:
            nodes = r.get("nodes", [])
            rels = r.get("rels", [])
            if not nodes:
                continue
            formatted = nodes[0]
            for i, rel in enumerate(rels):
                next_node = nodes[i + 1] if i + 1 < len(nodes) else "?"
                formatted += f" —[:{rel}]→ {next_node}"
            paths.append(formatted)
        return paths


# Global singleton instance
northstar_graph = NorthstarGraph()
