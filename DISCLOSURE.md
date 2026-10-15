# AI Tools & Technology Disclosure

**Hackathon:** Graph Hacks: Context for AI Agents (WeMakeDevs × FalkorDB)  
**Track:** Track 03 — Company Brain  
**Builder:** Solo ([Lakshay Tayal — @tayal01](https://github.com/tayal01))  
**Project:** Who Knows What  

---

## 1. AI Assistance During Development
In accordance with the hackathon rules on AI coding tools:
- **Antigravity AI Assistant / Pair Programmer:** Used for scaffolding project directory layout, drafting initial Cypher query structures, writing frontend CSS/HTML templates, and validating FalkorDB graph responses.
- All application logic, database schemas, relationship models, test queries, and documentation were reviewed, verified, and executed locally during the hackathon period starting **15 October 2026**.

---

## 2. Runtime AI Model
- **Agent Framework:** OpenAI / Groq tool-calling protocol.
- **Models Supported:** `llama-3.3-70b-versatile` (via Groq free tier) or `gpt-4o-mini` (via OpenAI).
- **Fallback Engine:** Deterministic rule-based tool dispatcher with full Cypher execution directly against FalkorDB if no external API key is configured.
- **Central Graph Engine:** **FalkorDB** (Docker image `falkordb/falkordb:latest`). If FalkorDB is offline, the agent has zero knowledge and cannot answer organizational questions.
