#!/usr/bin/env bash
# Who Knows What — Start Script
# Runs FalkorDB, seeds graph, and launches the application

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================================="
echo "🧠 Starting 'Who Knows What' — FalkorDB Company Brain"
echo "=========================================================="

# 1. Check & Start FalkorDB Container
echo "1. Checking FalkorDB Docker container..."
if ! docker ps --format '{{.Names}}' | grep -q 'falkordb-northstar'; then
  echo "   Starting FalkorDB via docker compose..."
  docker compose up -d
else
  echo "   FalkorDB container 'falkordb-northstar' is running."
fi

# 2. Check Virtual Environment
if [ ! -d "$PROJECT_ROOT/.venv" ]; then
  echo "2. Creating Python virtual environment..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  echo "2. Activating Python virtual environment..."
  source .venv/bin/activate
fi

# 3. Seed Graph (Fast check)
echo "3. Verifying FalkorDB Northstar Graph..."
python -c "
from backend.graph import northstar_graph
try:
    g = northstar_graph.get_graph()
    count = g.query('MATCH (n) RETURN count(n)')[0][0]
    print(f'   Northstar Graph ready with {count} nodes.')
except Exception:
    print('   Seeding initial Northstar graph...')
    from data.seed import seed
    seed()
"

echo "=========================================================="
echo "🚀 Application is ready!"
echo "   • Main UI (React):         http://localhost:8000"
echo "   • FalkorDB Browser:        http://localhost:3000"
echo "   • API Docs (FastAPI):      http://localhost:8000/docs"
echo "=========================================================="

# 4. Start Uvicorn Server
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
