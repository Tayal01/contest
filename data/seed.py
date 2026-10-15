"""
seed.py - Seeds the Northstar Labs graph dataset into FalkorDB
Track 03: Company Brain (Solo)
"""

import json
import os
import sys
from pathlib import Path
from falkordb import FalkorDB

# Configuration
FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))
GRAPH_NAME = os.getenv("FALKORDB_GRAPH", "northstar")

DATA_FILE = Path(__file__).parent / "northstar.json"


def seed():
    print(f"Connecting to FalkorDB at {FALKORDB_HOST}:{FALKORDB_PORT}...")
    db = FalkorDB(host=FALKORDB_HOST, port=FALKORDB_PORT)
    graph = db.select_graph(GRAPH_NAME)

    print(f"Resetting existing graph '{GRAPH_NAME}' if present...")
    try:
        graph.delete()
        print(f"Deleted previous '{GRAPH_NAME}' graph.")
    except Exception as e:
        print(f"Graph '{GRAPH_NAME}' did not exist yet: {e}")

    # Re-select graph after deletion
    graph = db.select_graph(GRAPH_NAME)

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    print("Creating indexes...")
    indexes = [
        "CREATE INDEX FOR (p:Person) ON (p.name)",
        "CREATE INDEX FOR (t:Team) ON (t.name)",
        "CREATE INDEX FOR (pr:Project) ON (pr.name)",
        "CREATE INDEX FOR (s:System) ON (s.name)",
        "CREATE INDEX FOR (tk:Ticket) ON (tk.key)",
        "CREATE INDEX FOR (d:Decision) ON (d.title)",
        "CREATE INDEX FOR (doc:Document) ON (doc.title)",
    ]
    for idx_query in indexes:
        try:
            graph.query(idx_query)
        except Exception as e:
            print(f"Index notice: {e}")

    print("Inserting Teams...")
    for team in data.get("teams", []):
        graph.query("MERGE (:Team {name: $name})", {"name": team["name"]})

    print("Inserting Systems...")
    for system in data.get("systems", []):
        graph.query(
            "MERGE (:System {name: $name, criticality: $criticality})",
            {"name": system["name"], "criticality": system["criticality"]},
        )

    print("Inserting Projects...")
    for project in data.get("projects", []):
        graph.query(
            "MERGE (:Project {name: $name, status: $status})",
            {"name": project["name"], "status": project["status"]},
        )

    print("Inserting People & their relationships...")
    for person in data.get("people", []):
        # Create Person
        graph.query(
            """
            MERGE (p:Person {
                name: $name,
                role: $role,
                email: $email,
                skills: $skills
            })
            """,
            {
                "name": person["name"],
                "role": person["role"],
                "email": person["email"],
                "skills": ", ".join(person.get("skills", [])),
            },
        )

        # Person MEMBER_OF Team
        if person.get("team"):
            graph.query(
                """
                MATCH (p:Person {name: $name}), (t:Team {name: $team})
                MERGE (p)-[:MEMBER_OF]->(t)
                """,
                {"name": person["name"], "team": person["team"]},
            )

        # Person WORKS_ON Project
        for proj in person.get("works_on", []):
            graph.query(
                """
                MATCH (p:Person {name: $name}), (pr:Project {name: $proj})
                MERGE (p)-[:WORKS_ON]->(pr)
                """,
                {"name": person["name"], "proj": proj},
            )

        # Person OWNS System
        for sys_name in person.get("owns", []):
            graph.query(
                """
                MATCH (p:Person {name: $name}), (s:System {name: $sys_name})
                MERGE (p)-[:OWNS]->(s)
                """,
                {"name": person["name"], "sys_name": sys_name},
            )

    print("Inserting System Dependencies (DEPENDS_ON)...")
    for dep in data.get("system_dependencies", []):
        graph.query(
            """
            MATCH (s1:System {name: $from_sys}), (s2:System {name: $to_sys})
            MERGE (s1)-[:DEPENDS_ON]->(s2)
            """,
            {"from_sys": dep["from"], "to_sys": dep["to"]},
        )

    print("Inserting Project Uses (USES)...")
    for use in data.get("project_uses", []):
        graph.query(
            """
            MATCH (pr:Project {name: $project}), (s:System {name: $system})
            MERGE (pr)-[:USES]->(s)
            """,
            {"project": use["project"], "system": use["system"]},
        )

    print("Inserting Tickets...")
    for tkt in data.get("tickets", []):
        graph.query(
            """
            MERGE (tk:Ticket {
                key: $key,
                title: $title,
                status: $status,
                opened_on: $opened_on
            })
            """,
            {
                "key": tkt["key"],
                "title": tkt["title"],
                "status": tkt["status"],
                "opened_on": tkt["opened_on"],
            },
        )
        # Link Ticket ABOUT Project or System
        graph.query(
            """
            MATCH (tk:Ticket {key: $key})
            OPTIONAL MATCH (pr:Project {name: $about})
            OPTIONAL MATCH (s:System {name: $about})
            WITH tk, coalesce(pr, s) AS target
            WHERE target IS NOT NULL
            MERGE (tk)-[:ABOUT]->(target)
            """,
            {"key": tkt["key"], "about": tkt["about"]},
        )
        # Link Ticket ASSIGNED_TO Person
        if tkt.get("assignee"):
            graph.query(
                """
                MATCH (tk:Ticket {key: $key}), (p:Person {name: $assignee})
                MERGE (tk)-[:ASSIGNED_TO]->(p)
                """,
                {"key": tkt["key"], "assignee": tkt["assignee"]},
            )

    print("Inserting Decisions...")
    for dec in data.get("decisions", []):
        graph.query(
            """
            MERGE (d:Decision {
                title: $title,
                decided_on: $decided_on,
                summary: $summary
            })
            """,
            {
                "title": dec["title"],
                "decided_on": dec["decided_on"],
                "summary": dec["summary"],
            },
        )
        # Link MADE_BY
        if dec.get("made_by"):
            graph.query(
                """
                MATCH (d:Decision {title: $title}), (p:Person {name: $made_by})
                MERGE (d)-[:MADE_BY]->(p)
                """,
                {"title": dec["title"], "made_by": dec["made_by"]},
            )
        # Link ABOUT
        graph.query(
            """
            MATCH (d:Decision {title: $title})
            OPTIONAL MATCH (pr:Project {name: $about})
            OPTIONAL MATCH (s:System {name: $about})
            WITH d, coalesce(pr, s) AS target
            WHERE target IS NOT NULL
            MERGE (d)-[:ABOUT]->(target)
            """,
            {"title": dec["title"], "about": dec["about"]},
        )

    print("Inserting Documents...")
    for doc in data.get("documents", []):
        graph.query(
            """
            MERGE (doc:Document {
                title: $title,
                kind: $kind,
                summary: $summary
            })
            """,
            {
                "title": doc["title"],
                "kind": doc["kind"],
                "summary": doc["summary"],
            },
        )
        # Link DESCRIBES
        graph.query(
            """
            MATCH (doc:Document {title: $title})
            OPTIONAL MATCH (pr:Project {name: $describes})
            OPTIONAL MATCH (s:System {name: $describes})
            WITH doc, coalesce(pr, s) AS target
            WHERE target IS NOT NULL
            MERGE (doc)-[:DESCRIBES]->(target)
            """,
            {"title": doc["title"], "describes": doc["describes"]},
        )

    print("\n--- Northstar Labs Graph Seed Summary ---")
    res_nodes = graph.query("MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY count DESC")
    for row in res_nodes.result_set:
        print(f"  Node [{row[0]}]: {row[1]}")

    res_edges = graph.query("MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS count ORDER BY count DESC")
    for row in res_edges.result_set:
        print(f"  Rel  -[:{row[0]}]->: {row[1]}")

    print("\nGraph 'northstar' seeded successfully!")


if __name__ == "__main__":
    seed()
