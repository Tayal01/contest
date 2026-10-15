"""
agent.py - LLM tool-calling agent with FalkorDB grounding
Track 03: Company Brain (Solo)
"""

import json
import os
from typing import Any, Dict, List, Optional
from openai import OpenAI
from backend.graph import northstar_graph
from backend.prompts import SYSTEM_PROMPT, AGENT_TOOLS


def get_llm_client():
    """
    Initializes OpenAI or Groq client based on available environment variables.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if groq_key:
        return OpenAI(
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1",
        ), os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    elif openai_key:
        return OpenAI(
            api_key=openai_key,
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        ), os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    else:
        return None, None


def execute_tool(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dispatches tool calls directly to FalkorDB queries in NorthstarGraph.
    """
    if tool_name == "who_knows_system":
        return northstar_graph.who_knows_system(args.get("name", ""))
    elif tool_name == "blast_radius":
        return northstar_graph.blast_radius(args.get("name", ""))
    elif tool_name == "decision_about":
        return northstar_graph.decision_about(args.get("topic", ""))
    elif tool_name == "open_tickets":
        return northstar_graph.open_tickets(args.get("name", ""))
    else:
        raise ValueError(f"Unknown tool: {tool_name}")


def rule_based_fallback_tool_selection(question: str) -> tuple[str, Dict[str, Any]]:
    """
    Deterministic tool selector if no LLM API key is configured yet.
    Ensures zero downtime and immediate demoability.
    """
    q = question.lower()
    if any(k in q for k in ["break", "down", "fail", "blast", "ping", "outage"]):
        # Extract system name
        for s in ["login", "ledger", "notify", "app api", "warehouse", "checkout"]:
            if s in q:
                return "blast_radius", {"name": s}
        return "blast_radius", {"name": "login"}

    elif any(k in q for k in ["decid", "decision", "2fa", "rfc", "choice"]):
        for s in ["2fa", "ledger", "notify", "graphql", "deploy", "login"]:
            if s in q:
                return "decision_about", {"topic": s}
        return "decision_about", {"topic": "2fa"}

    elif any(k in q for k in ["ticket", "jira", "issue", "bug", "task"]):
        for s in ["payment", "login", "ledger", "notify", "mobile", "ios"]:
            if s in q:
                return "open_tickets", {"name": s}
        return "open_tickets", {"name": "payments"}

    else:
        for s in ["payment", "login", "ledger", "notify", "warehouse", "mobile"]:
            if s in q:
                return "who_knows_system", {"name": s}
        return "who_knows_system", {"name": "payments"}


def query_agent(question: str) -> Dict[str, Any]:
    """
    Runs the agent:
    1. Selects tool via LLM tool-calling (or deterministic fallback)
    2. Executes Cypher query on FalkorDB
    3. Synthesizes grounded natural language response + paths
    """
    client, model_name = get_llm_client()

    tool_used = None
    tool_args = {}
    tool_result = None

    if client:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ]

        # Step 1: LLM Tool Call
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                tools=AGENT_TOOLS,
                tool_choice="auto",
                temperature=0.1,
            )
            msg = response.choices[0].message
            if msg.tool_calls:
                call = msg.tool_calls[0]
                tool_used = call.function.name
                tool_args = json.loads(call.function.arguments)
                tool_result = execute_tool(tool_used, tool_args)

                # Step 2: Feed tool output back to LLM for final answer
                messages.append(msg)
                messages.append({
                    "role": "tool",
                    "tool_call_id": call.id,
                    "name": tool_used,
                    "content": json.dumps(tool_result),
                })

                synthesis = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.2,
                )
                answer_text = synthesis.choices[0].message.content
            else:
                answer_text = msg.content
        except Exception as e:
            # Fallback on API failure
            tool_used, tool_args = rule_based_fallback_tool_selection(question)
            tool_result = execute_tool(tool_used, tool_args)
            answer_text = f"(LLM error: {e}. Executed direct FalkorDB graph tool: '{tool_used}')"
    else:
        # Offline mode without API key
        tool_used, tool_args = rule_based_fallback_tool_selection(question)
        tool_result = execute_tool(tool_used, tool_args)

        # Build clean deterministic answer from rows
        rows = tool_result.get("rows", [])
        if tool_used == "who_knows_system":
            people = [f"{r['person']} ({r['role']}) via {r.get('relationship', 'WORKS_ON')} {r.get('via_entity_name', '')}" for r in rows]
            answer_text = f"Based on FalkorDB records, the following people have worked on or own '{tool_args.get('name')}':\n• " + "\n• ".join(people) if people else "No records found in graph."
        elif tool_used == "blast_radius":
            r = rows[0] if rows else {}
            breaks = ", ".join(r.get("systems_that_break", [])) or "None"
            projs = ", ".join(r.get("projects_affected", [])) or "None"
            pings = ", ".join(r.get("owners_to_ping", [])) or "None"
            answer_text = f"Blast radius for '{r.get('down_system', tool_args.get('name'))}':\n• Systems that break: {breaks}\n• Projects affected: {projs}\n• Owners to ping: {pings}"
        elif tool_used == "decision_about":
            decs = [f"'{r['title']}' decided on {r['decided_on']} by {r['decided_by']} ({r.get('role', '')}): {r['summary']}" for r in rows]
            answer_text = f"Decisions recorded in FalkorDB about '{tool_args.get('topic')}':\n• " + "\n• ".join(decs) if decs else "No decision found."
        elif tool_used == "open_tickets":
            tkts = [f"[{r['key']}] {r['title']} (Assignee: {r.get('assignee', 'Unassigned')})" for r in rows]
            answer_text = f"Open tickets in FalkorDB for '{tool_args.get('name')}':\n• " + "\n• ".join(tkts) if tkts else "No open tickets found."
        else:
            answer_text = "Query completed."

    return {
        "question": question,
        "answer": answer_text,
        "tool_used": tool_used,
        "tool_args": tool_args,
        "cypher_used": tool_result.get("cypher") if tool_result else None,
        "paths": tool_result.get("paths", []) if tool_result else [],
        "rows": tool_result.get("rows", []) if tool_result else [],
        "count": tool_result.get("count", 0) if tool_result else 0,
        "llm_active": client is not None,
    }
