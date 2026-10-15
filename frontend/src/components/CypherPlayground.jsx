import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Copy, Check, Terminal, Clock, Database, Sparkles } from 'lucide-react';

const PRESET_QUERIES = [
  {
    label: 'All Owners of Systems',
    cypher: 'MATCH (p:Person)-[:OWNS]->(s:System)\nRETURN p.name AS owner, p.role AS role, s.name AS system, s.criticality AS criticality\nORDER BY s.criticality DESC',
  },
  {
    label: 'Service Dependency Tree',
    cypher: 'MATCH (dep:System)-[:DEPENDS_ON]->(base:System)\nRETURN dep.name AS caller_system, base.name AS upstream_dependency',
  },
  {
    label: 'Open Tickets & Assignees',
    cypher: 'MATCH (t:Ticket)-[:ABOUT]->(target)\nOPTIONAL MATCH (t)-[:ASSIGNED_TO]->(p:Person)\nRETURN t.key AS ticket, t.title AS title, t.status AS status, target.name AS about, p.name AS assignee\nORDER BY t.key ASC',
  },
  {
    label: 'Architecture Decisions (ADRs)',
    cypher: 'MATCH (d:Decision)-[:MADE_BY]->(p:Person)\nRETURN d.title AS title, d.decided_on AS date, d.summary AS summary, p.name AS author',
  },
  {
    label: 'Team Memberships',
    cypher: 'MATCH (p:Person)-[:MEMBER_OF]->(t:Team)\nRETURN t.name AS team, collect(p.name) AS members, count(p) AS head_count\nORDER BY head_count DESC',
  },
];

export default function CypherPlayground() {
  const [query, setQuery] = useState(PRESET_QUERIES[0].cypher);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleRunQuery = async () => {
    if (!query.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/graph/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Cypher query execution error.');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      className="playground-layout"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Preset Queries Strip */}
      <div className="presets-bar">
        <span className="presets-label">
          <Sparkles size={13} className="text-amber" />
          Example Cypher Queries:
        </span>
        <div className="presets-list">
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              className="preset-chip-btn"
              onClick={() => {
                setQuery(preset.cypher);
                setResult(null);
                setError(null);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Editor Box */}
      <div className="editor-card">
        <div className="editor-header">
          <div className="editor-title">
            <Terminal size={14} className="text-purple" />
            <span>Cypher Editor (FalkorDB / OpenCypher)</span>
          </div>
          <div className="editor-actions">
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button 
              className="run-cypher-btn" 
              onClick={handleRunQuery}
              disabled={isRunning || !query.trim()}
            >
              <Play size={13} fill="currentColor" />
              <span>{isRunning ? 'Running...' : 'Run Query'}</span>
            </button>
          </div>
        </div>

        <textarea
          className="cypher-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          placeholder="Enter Cypher statement (e.g. MATCH (n) RETURN n LIMIT 25)..."
          spellCheck={false}
        />
      </div>

      {/* Query Result / Error Display */}
      {error && (
        <div className="cypher-error-box">
          <strong>Query Error:</strong>
          <pre>{error}</pre>
        </div>
      )}

      {result && (
        <div className="results-card">
          <div className="results-meta">
            <div className="meta-item">
              <Database size={13} className="text-cyan" />
              <span>Returned <strong>{result.count}</strong> rows</span>
            </div>
            <div className="meta-item">
              <Clock size={13} className="text-emerald" />
              <span>FalkorDB Latency: <strong>{result.latency_ms} ms</strong></span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table-preview">
              <thead>
                <tr>
                  {result.columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 ? (
                  <tr>
                    <td colSpan={result.columns.length} style={{ textAlign: 'center', padding: '16px' }}>
                      Query returned 0 rows.
                    </td>
                  </tr>
                ) : (
                  result.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {result.columns.map((col) => {
                        const val = row[col];
                        const text = Array.isArray(val)
                          ? val.join(', ')
                          : typeof val === 'object' && val !== null
                          ? JSON.stringify(val)
                          : String(val ?? '');
                        return <td key={col}>{text}</td>;
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
