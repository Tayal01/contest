"""
main.py - FastAPI application for 'Who Knows What' Company Brain
Track 03: Company Brain (Solo)
"""

import os
import sys
import time
from pathlib import Path

# Robust sys.path bootstrapping to prevent directory-dependent import failures
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.agent import query_agent
from backend.graph import northstar_graph
from data.seed import seed as run_seed

BASE_DIR = ROOT_DIR
FRONTEND_DIR = BASE_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"

app = FastAPI(
    title="Who Knows What — Company Brain",
    description="FalkorDB-powered company brain agent for Graph Hacks Track 03",
    version="2.0.0",
)

# Enable CORS for local dev / client flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionRequest(BaseModel):
    question: str


class CypherQueryRequest(BaseModel):
    query: str


@app.get("/health")
def health_check():
    """
    Checks health of FastAPI and FalkorDB connection.
    """
    try:
        graph = northstar_graph.get_graph()
        res = graph.query("MATCH (n) RETURN count(n) AS total_nodes")
        total_nodes = res.result_set[0][0] if res.result_set else 0
        return {
            "status": "ok",
            "falkordb": "connected",
            "graph": northstar_graph.graph_name,
            "total_nodes": total_nodes,
        }
    except Exception as e:
        return {
            "status": "degraded",
            "falkordb": "error",
            "error": str(e),
        }


@app.post("/ask")
def ask_question(payload: QuestionRequest):
    """
    Main agent endpoint. Takes an English question, chooses a tool, runs Cypher on FalkorDB,
    and returns grounded answer + path + Cypher query + raw rows.
    """
    q = payload.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = query_agent(q)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.get("/graph/stats")
def graph_stats():
    """
    Returns counts of all node labels and relationship types in Northstar graph.
    """
    try:
        graph = northstar_graph.get_graph()
        nodes_res = graph.query("MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY count DESC")
        rels_res = graph.query("MATCH ()-[r]->() RETURN type(r) AS rel, count(*) AS count ORDER BY count DESC")

        return {
            "nodes": {row[0]: row[1] for row in nodes_res.result_set if row[0]},
            "relationships": {row[0]: row[1] for row in rels_res.result_set if row[0]},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FalkorDB query error: {str(e)}")


@app.get("/graph/overview")
def graph_overview():
    """
    Returns nodes and edges formatted for visual graph rendering.
    """
    try:
        graph = northstar_graph.get_graph()
        res = graph.query("""
            MATCH (a)-[r]->(b)
            RETURN labels(a)[0] AS a_label,
                   coalesce(a.name, a.title, a.key) AS a_name,
                   type(r) AS rel,
                   labels(b)[0] AS b_label,
                   coalesce(b.name, b.title, b.key) AS b_name
            LIMIT 150
        """)
        links = []
        for row in res.result_set:
            links.append({
                "source": row[1],
                "source_type": row[0],
                "target": row[4],
                "target_type": row[3],
                "relationship": row[2],
            })
        return {"links": links}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph overview error: {str(e)}")


@app.get("/graph/nodes")
def get_graph_nodes(label: str = ""):
    """
    Returns nodes and their properties, optionally filtered by label.
    """
    try:
        graph = northstar_graph.get_graph()
        if label:
            query = f"MATCH (n:{label}) RETURN n LIMIT 50"
        else:
            query = "MATCH (n) RETURN labels(n)[0] AS label, properties(n) AS props LIMIT 100"
        
        result = graph.query(query)
        nodes = []
        for row in result.result_set:
            if label:
                node_obj = row[0]
                nodes.append({
                    "label": label,
                    "properties": node_obj.properties if hasattr(node_obj, "properties") else str(node_obj)
                })
            else:
                nodes.append({
                    "label": row[0],
                    "properties": row[1]
                })
        return {"nodes": nodes, "count": len(nodes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching nodes: {str(e)}")


@app.post("/graph/query")
def execute_raw_cypher(payload: CypherQueryRequest):
    """
    Executes a raw Cypher query directly on FalkorDB for the Cypher Playground.
    """
    q = payload.query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Cypher query cannot be empty.")
    try:
        start_t = time.perf_counter()
        graph = northstar_graph.get_graph()
        result = graph.query(q)
        duration_ms = round((time.perf_counter() - start_t) * 1000, 2)
        columns = [str(c[1]) if isinstance(c, (list, tuple)) and len(c) >= 2 else str(c) for c in result.header]
        rows = []
        for raw_row in result.result_set:
            row_dict = {}
            for col, val in zip(columns, raw_row):
                if hasattr(val, "properties"):
                    row_dict[col] = val.properties
                else:
                    row_dict[col] = val
            rows.append(row_dict)
        return {
            "columns": columns,
            "rows": rows,
            "count": len(rows),
            "latency_ms": duration_ms,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cypher error: {str(e)}")


@app.post("/graph/reseed")
def reseed_graph():
    """
    Triggers re-seeding of Northstar Labs sample data.
    """
    try:
        run_seed()
        return {"status": "success", "message": "Northstar graph re-seeded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Re-seed failed: {str(e)}")


# Serve React frontend build (dist) or development static files
if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")
elif FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.api_route("/", methods=["GET", "HEAD"])
def serve_index():
    if (DIST_DIR / "index.html").exists():
        return FileResponse(DIST_DIR / "index.html")
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Who Knows What backend is active. Frontend UI loading..."}


if __name__ == "__main__":
    import uvicorn
    # Allows running directly via `python backend/main.py` or `python main.py`
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
