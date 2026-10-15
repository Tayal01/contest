/**
 * app.js - Who Knows What Frontend Controller
 * Connects UI to FastAPI + FalkorDB
 */

document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chat-messages");
  const askForm = document.getElementById("ask-form");
  const userInput = document.getElementById("user-input");
  const submitBtn = document.getElementById("submit-btn");
  const reseedBtn = document.getElementById("reseed-btn");
  const dbStatusPill = document.getElementById("db-status-pill");
  const dbStatusText = document.getElementById("db-status-text");
  const llmIndicator = document.getElementById("llm-indicator");

  // Stat counters
  const statPeople = document.getElementById("stat-people");
  const statSystems = document.getElementById("stat-systems");
  const statProjects = document.getElementById("stat-projects");
  const statTickets = document.getElementById("stat-tickets");

  // 1. Initial Health and Stats Check
  fetchHealthAndStats();

  // 2. Clickable Demo Buttons
  document.querySelectorAll(".demo-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const query = btn.getAttribute("data-query");
      if (query) {
        userInput.value = query;
        askForm.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });
  });

  // 3. Reset / Re-seed Button
  if (reseedBtn) {
    reseedBtn.addEventListener("click", async () => {
      if (!confirm("Re-seed the Northstar Labs graph with fresh data?")) return;
      reseedBtn.disabled = true;
      reseedBtn.textContent = "Resetting...";
      try {
        const res = await fetch("/graph/reseed", { method: "POST" });
        const data = await res.json();
        alert(data.message || "Graph reset successfully!");
        fetchHealthAndStats();
      } catch (err) {
        alert("Failed to reset graph: " + err.message);
      } finally {
        reseedBtn.disabled = false;
        reseedBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Reset Graph
        `;
      }
    });
  }

  // 4. Form Submit Handler
  askForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = userInput.value.trim();
    if (!query) return;

    // Append User Message Card
    appendUserMessage(query);
    userInput.value = "";
    submitBtn.disabled = true;

    // Append Loading Agent Card
    const loadingCardId = "agent-loading-" + Date.now();
    appendLoadingMessage(loadingCardId);

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      replaceLoadingWithAgentResponse(loadingCardId, result);

      if (result.llm_active) {
        llmIndicator.textContent = "LLM Tool-Calling Active";
        llmIndicator.style.color = "#38bdf8";
      } else {
        llmIndicator.textContent = "Direct FalkorDB Mode";
        llmIndicator.style.color = "#a78bfa";
      }
    } catch (err) {
      replaceLoadingWithError(loadingCardId, err.message);
    } finally {
      submitBtn.disabled = false;
      userInput.focus();
    }
  });

  // --- Helpers ---

  async function fetchHealthAndStats() {
    try {
      const healthRes = await fetch("/health");
      const health = await healthRes.json();
      if (health.status === "ok" && health.falkordb === "connected") {
        dbStatusPill.className = "status-indicator";
        dbStatusText.textContent = `FalkorDB Connected (${health.total_nodes} nodes)`;
      } else {
        dbStatusPill.className = "status-indicator error";
        dbStatusText.textContent = "FalkorDB Disconnected";
      }

      const statsRes = await fetch("/graph/stats");
      const stats = await statsRes.json();
      if (stats.nodes) {
        if (statPeople && stats.nodes.Person) statPeople.textContent = stats.nodes.Person;
        if (statSystems && stats.nodes.System) statSystems.textContent = stats.nodes.System;
        if (statProjects && stats.nodes.Project) statProjects.textContent = stats.nodes.Project;
        if (statTickets && stats.nodes.Ticket) statTickets.textContent = stats.nodes.Ticket;
      }
    } catch (err) {
      dbStatusPill.className = "status-indicator error";
      dbStatusText.textContent = "FalkorDB Offline";
    }
  }

  function appendUserMessage(text) {
    const card = document.createElement("div");
    card.className = "message-card user-message-card";
    card.innerHTML = `
      <div class="card-avatar">👤</div>
      <div class="card-body">
        <div class="card-header-line">
          <strong>You</strong>
          <span class="time-badge">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="user-text">${escapeHtml(text)}</div>
      </div>
    `;
    chatMessages.appendChild(card);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendLoadingMessage(id) {
    const card = document.createElement("div");
    card.className = "message-card agent-response-card";
    card.id = id;
    card.innerHTML = `
      <div class="card-avatar">⚡</div>
      <div class="card-body">
        <div class="card-header-line">
          <strong>Who Knows What — FalkorDB Agent</strong>
          <span class="tool-badge-pill">Querying Graph...</span>
        </div>
        <div class="loading-skeleton">
          <div class="skeleton-line" style="width: 85%;"></div>
          <div class="skeleton-line" style="width: 70%;"></div>
          <div class="skeleton-line" style="width: 95%;"></div>
        </div>
      </div>
    `;
    chatMessages.appendChild(card);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function replaceLoadingWithAgentResponse(cardId, data) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const toolName = data.tool_used || "cypher_tool";
    const answer = data.answer || "No response provided.";
    const cypher = data.cypher_used || "";
    const paths = data.paths || [];
    const rows = data.rows || [];

    // Format Paths visualizer
    let pathsHtml = "";
    if (paths && paths.length > 0) {
      pathsHtml = `
        <div class="path-visualizer-box">
          <div class="box-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Graph Traversal Path Cites (${paths.length} chains)
          </div>
          ${paths.map(p => `<div class="graph-path-row">${formatPathString(p)}</div>`).join("")}
        </div>
      `;
    }

    // Format Cypher Inspector
    let cypherHtml = "";
    if (cypher) {
      cypherHtml = `
        <div class="inspector-accordion">
          <button class="inspector-toggle" onclick="toggleAccordion(this)">
            <span>Cypher Query Executed on FalkorDB</span>
            <span>▼</span>
          </button>
          <div class="inspector-body" style="display: none;">
            <pre class="cypher-code-block"><code>${escapeHtml(cypher)}</code></pre>
          </div>
        </div>
      `;
    }

    // Format Raw Rows Inspector
    let rowsHtml = "";
    if (rows && rows.length > 0) {
      const headers = Object.keys(rows[0]);
      rowsHtml = `
        <div class="inspector-accordion">
          <button class="inspector-toggle" onclick="toggleAccordion(this)">
            <span>FalkorDB Raw Rows (${rows.length})</span>
            <span>▼</span>
          </button>
          <div class="inspector-body" style="display: none;">
            <table class="data-table-preview">
              <thead>
                <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${rows.slice(0, 10).map(row => `
                  <tr>${headers.map(h => `<td>${escapeHtml(formatCellVal(row[h]))}</td>`).join("")}</tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-avatar">🧠</div>
      <div class="card-body">
        <div class="card-header-line">
          <strong>Who Knows What</strong>
          <span class="tool-badge-pill">Tool: ${escapeHtml(toolName)}</span>
        </div>
        <div class="agent-answer-text">${formatAnswerMarkdown(answer)}</div>
        ${pathsHtml}
        ${cypherHtml}
        ${rowsHtml}
      </div>
    `;

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function replaceLoadingWithError(cardId, errorMsg) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.innerHTML = `
      <div class="card-avatar" style="background: #ef4444;">⚠️</div>
      <div class="card-body">
        <div class="card-header-line">
          <strong style="color: #fca5a5;">Agent Query Error</strong>
        </div>
        <p style="color: #fca5a5;">Failed to query FalkorDB or process response: ${escapeHtml(errorMsg)}</p>
      </div>
    `;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function formatPathString(pathStr) {
    // Formats strings like: Asha Patel —[:OWNS]→ Login ←[:DEPENDS_ON]— App API
    const parts = pathStr.split(/(—\[:.*?\]→|←\[:.*?\]—)/g);
    return parts.map(part => {
      if (part.startsWith("—[:") || part.startsWith("←[:")) {
        return `<span class="path-arrow"><code>${escapeHtml(part)}</code></span>`;
      } else {
        const trimmed = part.trim();
        return `<span class="path-node">${escapeHtml(trimmed)}</span>`;
      }
    }).join(" ");
  }

  function formatAnswerMarkdown(text) {
    // Basic bold and list item formatter
    let formatted = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    return formatted;
  }

  function formatCellVal(val) {
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object" && val !== null) return JSON.stringify(val);
    return String(val ?? "");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.toggleAccordion = function(button) {
    const body = button.nextElementSibling;
    const arrow = button.querySelector("span:last-child");
    if (body.style.display === "none") {
      body.style.display = "block";
      arrow.textContent = "▲";
    } else {
      body.style.display = "none";
      arrow.textContent = "▼";
    }
  };
});
