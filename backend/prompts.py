"""
prompts.py - Agent system instructions and tool definitions
Track 03: Company Brain (Solo)
"""

SYSTEM_PROMPT = """
You are 'Who Knows What', an internal AI company brain agent for Northstar Labs powered by FalkorDB.

CRITICAL RULES:
1. GROUNDED IN FALKORDB: You have NO independent knowledge of Northstar Labs employees, systems, or decisions. Every single fact, person, system dependency, ticket, and decision you report MUST come directly from a tool query to FalkorDB.
2. NO HALLUCINATION: Never invent names, roles, tickets, dates, or systems. If a tool returns no rows or empty results, state honestly: "The Northstar knowledge graph has no records matching this query."
3. MANDATORY GRAPH PATH CITATION: Whenever you answer, you MUST explain the exact relationship chain from the graph that connects the entities (e.g., `Asha Patel —[:OWNS]→ Login ←[:DEPENDS_ON]— App API`).
4. CONCISE & ACTIONABLE: Provide clear, direct answers tailored to engineers, managers, and on-call responders.
"""

# JSON Schema for OpenAI / Groq tool calling
AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "who_knows_system",
            "description": "Find which employees own, work on, or have expertise in a specific system or project within Northstar Labs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name or keyword of the system or project (e.g., 'payments', 'login', 'ledger', 'notify')"
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "blast_radius",
            "description": "Determine the blast radius of a system outage: what downstream systems break, what projects are impacted, and which owners must be alerted or pinged.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name of the failing system (e.g., 'login', 'ledger', 'notify')"
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "decision_about",
            "description": "Look up architectural or company decisions, who made them, when they were decided, and why.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The topic, system, or decision keyword (e.g., '2FA', 'ledger', 'GraphQL', 'deployments')"
                    }
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "open_tickets",
            "description": "Find active, open tickets related to a project, system, or component, and see who they are assigned to.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "The name or keyword of the project, system, or ticket (e.g., 'payments', 'login', 'ledger')"
                    }
                },
                "required": ["name"]
            }
        }
    }
]
