# Demo Questions for 'Who Knows What' (Graph Hacks Track 03)

Company Brain Agent powered by **FalkorDB** for fake company **Northstar Labs**.

Use these exact 4 questions for the live demonstration and video walkthrough:

---

### Question 1: System Expertise & Owners
> **Question:** `Who has worked on the payments system before?`
- **User Intent:** Identify engineers, PMs, and leads who have contributed to or own the Payments system or project.
- **FalkorDB Tool:** `who_knows_system`
- **Expected Traversal Path:**
  `Asha Patel —[:WORKS_ON]→ Payments`
  `Rohan Sharma —[:WORKS_ON]→ Payments`
  `Elena Rostova —[:WORKS_ON]→ Payments`
  `Sarah Jenkins —[:WORKS_ON]→ Payments`
  `Tara Chen —[:WORKS_ON]→ Payments`
- **Expected Answer:** Identifies Asha Patel, Rohan Sharma, Elena Rostova, Sarah Jenkins, and Tara Chen with their exact roles and contributions.

---

### Question 2: Outage Blast Radius & On-Call Ping
> **Question:** `If Login goes down, what else breaks, and who do I ping?`
- **User Intent:** Determine downstream cascading impact when the Login service fails, and identify the owner to ping.
- **FalkorDB Tool:** `blast_radius`
- **Expected Traversal Path:**
  `Asha Patel —[:OWNS]→ Login ←[:DEPENDS_ON]— Ledger`
  `Login ←[:DEPENDS_ON]— App API`
  `Login ←[:USES]— Payments`
- **Expected Answer:**
  - Criticality: `tier-1 critical`
  - Systems that break: `Ledger`, `App API`
  - Projects affected: `Payments`, `Onboarding`
  - Person to ping: `Asha Patel` (Staff Backend Engineer)

---

### Question 3: Architecture & Security Decisions
> **Question:** `What did we decide about 2FA last month, and who decided it?`
- **User Intent:** Retrieve the architectural record, owner, and date for two-factor authentication.
- **FalkorDB Tool:** `decision_about`
- **Expected Traversal Path:**
  `Asha Patel —[:MADE_BY]→ Require 2FA on Login —[:ABOUT]→ Login`
- **Expected Answer:**
  - Title: `Require 2FA on Login`
  - Decided on: `2026-09-12`
  - Decided by: `Asha Patel` (Staff Backend Engineer)
  - Summary: Mandate TOTP and WebAuthn 2FA for all internal and customer accounts before Q4.

---

### Question 4: Open Work & Ticket Ownership
> **Question:** `Which open tickets are about Payments, and who owns them?`
- **User Intent:** Locate open bug reports / Jira-style issues regarding Payments.
- **FalkorDB Tool:** `open_tickets`
- **Expected Traversal Path:**
  `Rohan Sharma —[:ASSIGNED_TO]→ PAY-18 —[:ABOUT]→ Payments`
  `Rohan Sharma —[:ASSIGNED_TO]→ PAY-24 —[:ABOUT]→ Payments`
- **Expected Answer:**
  - `PAY-18`: "Ledger timeout on refunds during high load" (Open, assigned to Rohan Sharma)
  - `PAY-24`: "Webhook retry exponential backoff tuning" (Open, assigned to Rohan Sharma)
