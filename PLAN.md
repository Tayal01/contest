# Who Knows What — Full Build Plan

**Hackathon:** Graph Hacks: Context for AI Agents (WeMakeDevs × FalkorDB)  
**Track:** Track 03 — Company Brain  
**Builder:** Solo  
**Dates:** Build only **15–18 Oct 2026 IST**. Plan and sketches before that are allowed.  
**Repo folder:** `~/Projects/who-knows-what`

This is the locked project. Do not switch tracks unless this plan is blocked.

---

## 1. Finalized project

### Product name

**Who Knows What**

### One-line pitch

An AI agent that answers company questions by walking a FalkorDB graph of people, teams, projects, systems, tickets, and decisions — and always shows the path it used.

### The story we demo

Pretend company: **Northstar Labs** (fake, public sample data — allowed by the rules).

A new engineer (or a manager) asks:

1. “Who has worked on the payments system before?”
2. “If Login goes down, what else breaks, and who do I ping?”
3. “What did we decide about 2FA last month, and who decided it?”
4. “Which open tickets are about Payments, and who owns them?”

The agent does **not** guess from a chat log. It **queries FalkorDB**, then answers in English, and draws/lists the chain:

`Asha —WORKS_ON→ Payments —USES→ Login`

If FalkorDB is turned off, the product has nothing to say. That is the rule we must pass.

### Why this project (locked)

| Reason | Detail |
|---|---|
| Matches Track 3 exactly | People, teams, projects, docs/tickets, decisions in one graph |
| Judges can *see* the graph | Browser + path in every answer |
| Solo-sized | Fake company dataset, 4 days, one person |
| Python + JS | FastAPI backend + simple web UI |
| Extra prize | Write a blog post about it → AirPods 5 side prize |
| Real-world impact | This is what companies actually want from “company brain” tools |

**We are not building:** fraud detection, multi-agent swarms, or a generic chatbot with a graph glued on the side.

---

## 2. What “done” looks like on 18 Oct

A judge (or you, in the video) can:

1. Open a live URL **or** follow README and run locally in a few commands.
2. Ask the four questions above in a chat box.
3. See an English answer **plus** the graph path.
4. Open FalkorDB Browser (`localhost:3000`) and see the same nodes/edges.
5. Read the README: graph model, Cypher, how to run, AI tools used.

---

## 3. Rules we must not break

Copied from the official Rules page. Treat these as blockers.

- FalkorDB is the **only** graph database and a **central** part of the product.
- If we remove FalkorDB and the app still “works,” we fail.
- Main code starts **after 15 Oct 2026, 12:01 AM IST**.
- Before that we may: read docs, sketch the model, write this plan, learn Cypher, set up Docker. We may **not** write the submission app.
- Data must be **fake / public / our own**. No private company dumps.
- AI coding tools are allowed. **Disclose them** in the README. We must be able to explain every part.
- Submit: public GitHub repo, README + graph model, Cypher queries, demo video, live deploy **or** local setup + video, track name **Company Brain**.
- Submissions close **18 Oct 2026, 11:59 PM IST**.
- Optional extra: blog post for the AirPods side prize.

---

## 4. How the product works (simple)

```
User types a question
        ↓
Frontend (HTML + JS)
        ↓
Backend (Python FastAPI)
        ↓
LLM picks a TOOL (not free Cypher)
        ↓
Tool runs a fixed Cypher query on FalkorDB
        ↓
Backend gets rows + relationship path
        ↓
LLM writes a short English answer using ONLY those rows
        ↓
UI shows: answer + path + optional mini graph
```

**Why tools, not “LLM writes Cypher”:**  
Free Cypher from an LLM breaks often and is hard to demo. Fixed tools always hit the graph, always return a path, and still prove FalkorDB is the brain.

---

## 5. Tech stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Graph DB | FalkorDB via Docker (`falkordb/falkordb`) | Mandatory |
| Optional host | FalkorDB Cloud if Docker is painful | Still FalkorDB |
| Backend | Python 3, FastAPI, `falkordb` pip package | Fast to write, official client |
| Agent | OpenAI-compatible API (OpenAI, Groq, or similar) with **tool calling** | You already use Python |
| Frontend | One HTML page + vanilla JS (or very small Vite app) | Enough for a demo |
| Data | JSON → Cypher seed script | Fake Northstar Labs org |
| Deploy | Docker Compose locally; try Railway / Render / Fly if time | Live URL preferred |
| Video | Phone or OBS, 2–3 minutes | Required |

**Need before 15 Oct:** a working LLM API key (Groq free tier is fine if OpenAI is paid). If no key, Day 1 of hacking we add Groq first.

**Do not use:** Neo4j, a second graph DB, or a vector DB as the main memory. Vector search inside FalkorDB is OK later if time allows; it is not Day 1.

---

## 6. Graph data model (locked)

One graph name: `northstar`

### Node labels

| Label | Properties | Meaning |
|---|---|---|
| `Person` | `name`, `role`, `email`, `skills` (list or string) | Employee |
| `Team` | `name` | Engineering, Support, … |
| `Project` | `name`, `status` | Payments, Mobile App, … |
| `System` | `name`, `criticality` | Login, Ledger, Notify, … |
| `Ticket` | `key`, `title`, `status`, `opened_on` | Jira-like |
| `Document` | `title`, `kind` | RFC, runbook, wiki |
| `Decision` | `title`, `decided_on`, `summary` | A recorded choice |

### Relationships

| From | Rel | To | Why |
|---|---|---|---|
| Person | `MEMBER_OF` | Team | Org chart |
| Person | `WORKS_ON` | Project | Who is on what |
| Person | `OWNS` | System | Who to ping |
| Project | `USES` | System | Project depends on service |
| System | `DEPENDS_ON` | System | Blast radius |
| Ticket | `ABOUT` | Project or System | Work items |
| Ticket | `ASSIGNED_TO` | Person | Owner |
| Decision | `MADE_BY` | Person | Who decided |
| Decision | `ABOUT` | Project or System | Topic |
| Document | `DESCRIBES` | System or Project | Source |
| Person | `MENTORED` | Person | Optional “who knows whom” |

Keep the first 10. Add `MENTORED` only if the seed data is still small.

### Size of fake data (target)

- ~12 people
- 4 teams
- 5 projects
- 6 systems with a few `DEPENDS_ON` edges
- ~10 tickets
- ~6 documents
- ~5 decisions

Small enough to explain. Large enough that a chatbot without a graph would get lost.

---

## 7. Agent tools (locked for MVP)

Each tool is one Cypher query. The LLM may only call these.

### Tool 1 — `who_knows_system`

**User meaning:** who worked on / owns this system?

```cypher
MATCH (p:Person)-[r:OWNS|WORKS_ON]->(mid)-[*0..2]-(s:System)
WHERE toLower(s.name) CONTAINS toLower($name)
RETURN p.name AS person, p.role AS role, type(r) AS how, s.name AS system
```

(We will tune the exact pattern on Day 1 so it is correct and returns a path.)

### Tool 2 — `blast_radius`

**User meaning:** if this service dies, what else breaks, who to ping?

```cypher
MATCH (down:System)
WHERE toLower(down.name) CONTAINS toLower($name)
OPTIONAL MATCH (other:System)-[:DEPENDS_ON]->(down)
OPTIONAL MATCH (proj:Project)-[:USES]->(down)
OPTIONAL MATCH (owner:Person)-[:OWNS]->(down)
RETURN down.name AS down,
       collect(DISTINCT other.name) AS also_breaks,
       collect(DISTINCT proj.name) AS projects,
       collect(DISTINCT owner.name) AS ping
```

### Tool 3 — `decision_about`

**User meaning:** what did we decide, who, when?

```cypher
MATCH (d:Decision)-[:ABOUT]->(x)
WHERE toLower(d.title) CONTAINS toLower($topic)
   OR toLower(x.name) CONTAINS toLower($topic)
OPTIONAL MATCH (d)-[:MADE_BY]->(p:Person)
RETURN d.title, d.decided_on, d.summary, p.name AS decided_by, labels(x)[0] AS about_type, x.name AS about
```

### Tool 4 — `open_tickets`

**User meaning:** open work on a project or system.

```cypher
MATCH (t:Ticket {status:'open'})-[:ABOUT]->(x)
WHERE toLower(x.name) CONTAINS toLower($name)
OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(p:Person)
RETURN t.key, t.title, x.name AS about, p.name AS assignee
```

### Tool 5 — `explain_path` (required for the brief)

Always return a path the UI can draw.

```cypher
MATCH path = (p:Person)-[*1..3]-(s:System)
WHERE toLower(s.name) CONTAINS toLower($name)
RETURN path
LIMIT 8
```

MVP = tools 1–5 working. No extra tools until that is solid.

---

## 8. Screens (keep it ugly-but-clear)

One page:

1. **Chat** — question in, answer out.
2. **Path panel** — “Asha → WORKS_ON → Payments → USES → Login”.
3. **Why this is a graph** — one sentence under the path.
4. Footer: “Powered by FalkorDB · Graph Hacks Track 3”.

Optional if time: a second page that lists people/systems (read-only from the graph).

We do **not** need login, multi-tenant, or a polished design system.

---

## 9. Planned repo layout (create on 15 Oct, not before)

```
who-knows-what/
  PLAN.md                 ← this file (already here)
  README.md               ← setup, model, Cypher, AI disclosure
  docker-compose.yml      ← FalkorDB + backend
  data/
    northstar.json        ← fake company
    seed.py               ← loads JSON into FalkorDB
  backend/
    main.py               ← FastAPI app
    graph.py              ← FalkorDB connection + Cypher tools
    agent.py              ← LLM + tool calling
    prompts.py            ← system prompt: only use tools, cite path
  frontend/
    index.html
    app.js
    styles.css
  scripts/
    demo_questions.md     ← questions we ask in the video
  DISCLOSURE.md           ← Cursor / ChatGPT / Copilot used
```

---

## 10. Calendar

Today is **Sunday 11 Oct 2026**. Hacking starts **Thursday 15 Oct, 12:01 AM IST**.

### Now → Wed 14 Oct (prep only — no submission code)

| Day | Do this | Do not |
|---|---|---|
| Sun 11 | This plan. Confirm Docker Desktop works. | No FastAPI app |
| Mon 12 | Run official Docker image. Open `http://localhost:3000`. Paste the README MotoGP Cypher by hand. | No project folders of app code |
| Tue 13 | On paper / this PLAN: draw 12 people and arrows. Join FalkorDB Discord if stuck. | No seed.py |
| Wed 14 | Get an LLM API key. Watch 1 Cypher video from the Resources page. Sleep. | No GitHub app repo yet if that counts as “main work” — empty private notes OK |

**Allowed now:** Docker practice, reading [docs.falkordb.com](https://docs.falkordb.com/), starring clients, Discord.

**Not allowed:** the backend, frontend, seed script, or “almost the whole app sitting in a folder waiting for Thursday.”

### Thu 15 Oct — Day 1: graph that exists

**Goal:** FalkorDB has Northstar data. You can answer all 4 demo questions with **raw Cypher** in the Browser. No LLM yet.

Hours (example, IST):

1. `docker compose` for FalkorDB only.
2. Create `data/northstar.json` and `seed.py`.
3. Load graph. Check node counts: `MATCH (n) RETURN labels(n), count(*)`.
4. Hand-write and save the 5 Cypher tools in `graph.py`.
5. Screenshot Browser for the video later.
6. Commit: “seed Northstar graph”.

**Done when:** Browser shows people connected to payments/login, and each demo question has a working query.

### Fri 16 Oct — Day 2: agent that must use the graph

**Goal:** Chat in the terminal or a tiny API: question → tool → Cypher → English + path.

1. FastAPI: `POST /ask` `{ "question": "..." }`.
2. `agent.py`: system prompt — *never invent people; only tool results*.
3. Wire tools 1–5.
4. Return JSON: `{ answer, path, cypher_used, rows }`.
5. Test the 4 questions. If the model skips tools, tighten the prompt.
6. Commit: “graph-backed agent API”.

**Done when:** curling `/ask` returns a path that matches the Browser.

### Sat 17 Oct — Day 3: UI, demo, deploy attempt

**Goal:** One web page a judge can use. Start deploy.

1. Frontend: chat + path list.
2. Highlight “graph used” on every answer.
3. README: install, model diagram (markdown mermaid), Cypher, disclosure.
4. Try public deploy (backend + note how to reach FalkorDB). If deploy is hard, freeze **local compose** + excellent README + video.
5. Record a **draft** 3-minute video. Watch it. Fix the worst bug.
6. Optional: start the blog post.

**Done when:** a stranger could follow README and ask a question.

### Sun 18 Oct — Day 4: submit before 11:59 PM IST

**Goal:** Submission uploaded with hours to spare. Target submit by **6:00 PM IST**.

Morning:

- Fix bugs only (no new features).
- Final video: 2–3 min, captioned if possible.
- Public GitHub repo.
- Fill WeMakeDevs form: repo, README, video, deploy or local, **track = Company Brain**.

Afternoon:

- Re-read rules. Confirm FalkorDB is named and required.
- Publish blog post (Hashnode / Dev.to / LinkedIn) and keep the URL.
- Submit. Do not wait until 11:30 PM.

---

## 11. Demo video script (2–3 minutes)

1. **0:00–0:20** — “Who Knows What is a company brain on FalkorDB. The graph is the source of answers, not a sidebar.”
2. **0:20–0:40** — Show FalkorDB Browser: Person → Project → System.
3. **0:40–1:10** — Question 1: who worked on Payments? Show path in the UI.
4. **1:10–1:40** — Question 2: if Login dies, blast radius + who to ping.
5. **1:40–2:10** — Question 3: 2FA decision, date, who decided.
6. **2:10–2:40** — Point at Cypher in README / response payload.
7. **2:40–3:00** — “Remove FalkorDB and this app has no answers. Track 3, Company Brain.”

Record screen + voice. Horizontal. No background music required.

---

## 12. README that judges will skim (write on Day 3)

Must include:

1. What it is (5 lines).
2. Track: **Company Brain**.
3. Architecture diagram.
4. Graph model (nodes + rels).
5. How to run: Docker, seed, open UI.
6. The Cypher for each tool (copy-paste).
7. Demo questions.
8. **AI disclosure:** Cursor used for coding; which LLM at runtime.
9. What is original work from 15–18 Oct.

---

## 13. Winning checklist (self-grade before submit)

Score yourself. If any “must” is No, fix it.

| Must | Yes/No |
|---|---|
| FalkorDB is required for answers | |
| Every answer shows a path | |
| Four demo questions work | |
| Public repo + README + Cypher | |
| Demo video | |
| Live URL or local steps that work | |
| Track selected: Company Brain | |
| Fake data only | |
| We can explain the model out loud | |
| AI tools disclosed | |

Stretch (only after musts):

- Blog post (AirPods side prize)
- Tiny graph drawing in the UI
- One write-back: “record this decision” creates a `Decision` node
- Top-50 t-shirt quality bar: it runs, it is clear, it is not empty

---

## 14. Risks and what we do instead

| Risk | Plan B |
|---|---|
| Docker will not run | FalkorDB Cloud free instance |
| LLM has no key | Groq free key; worst case: UI has buttons that call Cypher directly (still an “agent-shaped” tool UI — last resort, mention in README) |
| Deploy fails | Local Docker Compose + video. Rules allow this. |
| Scope creep (auth, Slack, real Jira) | Cut it. Four questions only. |
| Cypher returns empty | Seed data must contain the names used in the demo. Hard-code demo names in `demo_questions.md`. |
| LLM invents employees | Prompt + UI shows raw rows. If names are not in rows, do not print them. |

---

## 15. Explicit non-goals

- Not Track 1 fraud / security hunting
- Not Track 2 multi-agent memory mesh (we may store chat as nodes later; not MVP)
- Not compiling FalkorDB from the engine GitHub repo
- Not a mobile app
- Not production security / SSO
- Not using real employer data

---

## 16. Commands we will use (reference, run from 15 Oct)

Start database:

```bash
docker run -p 6379:6379 -p 3000:3000 -it --rm -v ./data:/var/lib/falkordb/data falkordb/falkordb
```

Python client (install on Day 1):

```bash
pip install falkordb fastapi uvicorn openai python-dotenv
```

Browser: `http://localhost:3000`  
API (after Day 2): `http://localhost:8000`  
UI (after Day 3): `http://localhost:8000` serving `frontend/` or a second static port.

---

## 17. Northstar Labs seed sketch (names we will actually use)

Use these names in data, UI examples, and the video so nothing mismatches.

**People:** Asha (backend, owns Login), Rohan (payments), Meera (mobile), Vikram (SRE, owns Notify), Priya (support lead), Arjun (intern).

**Teams:** Platform, Payments, Mobile, Support.

**Projects:** Payments, Mobile App, Onboarding, Infra.

**Systems:** Login (critical), Ledger, Notify, App API, Warehouse.

**Dependencies:** App API `DEPENDS_ON` Login; Payments `USES` Ledger and Login; Notify used by Payments.

**Decision:** “Require 2FA on Login” — made by Asha, 12 Sep 2026, about Login.

**Ticket:** `PAY-18` open, “Ledger timeout on refunds”, assigned Rohan, ABOUT Payments.

If a demo question uses a name, that name **must** exist in the JSON.

---

## 18. After this plan

1. You read this file and say if anything is unclear.
2. Until 15 Oct: Docker + Browser + Cypher practice only.
3. On 15 Oct 12:01 AM IST we start coding in this folder together.

**Locked product:** Who Knows What — Company Brain agent on FalkorDB for fake company Northstar Labs.
