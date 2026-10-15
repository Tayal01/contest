import React from 'react';
import { motion } from 'framer-motion';
import { GitFork, Layers, Database, ShieldCheck, Zap, ArrowRight, RefreshCw } from 'lucide-react';

const SCHEMA_NODES = [
  { label: 'Person', count: 12, color: '#38bdf8', props: ['name', 'role', 'email', 'skills'], desc: 'Engineers, Product Managers, QA, and Maintainers' },
  { label: 'System', count: 6, color: '#f43f5e', props: ['name', 'criticality'], desc: 'Core tech services: Login, Ledger, Notify, App API, Warehouse, Checkout' },
  { label: 'Project', count: 5, color: '#a78bfa', props: ['name', 'status'], desc: 'Cross-functional initiatives: Payments, Mobile App, Infra...' },
  { label: 'Ticket', count: 8, color: '#34d399', props: ['key', 'title', 'status', 'opened_on'], desc: 'Operational Jira tickets with priority, assignees, and targets' },
  { label: 'Decision', count: 5, color: '#fbbf24', props: ['title', 'decided_on', 'summary'], desc: 'Recorded architectural choices (ADRs) and security policies' },
  { label: 'Document', count: 6, color: '#818cf8', props: ['title', 'kind', 'summary'], desc: 'Technical RFCs, Runbooks, and system wiki specifications' },
  { label: 'Team', count: 4, color: '#ec4899', props: ['name'], desc: 'Organizational teams: Platform, Payments, Mobile, Support' },
];

const SCHEMA_EDGES = [
  { from: 'Person', rel: '[:MEMBER_OF]', to: 'Team', desc: 'Organizational hierarchy & team structure' },
  { from: 'Person', rel: '[:WORKS_ON]', to: 'Project', desc: 'Active contributors on specific initiatives' },
  { from: 'Person', rel: '[:OWNS]', to: 'System', desc: 'Direct technical ownership and on-call escalation' },
  { from: 'Project', rel: '[:USES]', to: 'System', desc: 'Systems required by higher-level customer projects' },
  { from: 'System', rel: '[:DEPENDS_ON]', to: 'System', desc: 'Upstream microservice dependencies and blast-radius graph' },
  { from: 'Ticket', rel: '[:ABOUT]', to: 'Project | System', desc: 'Target entity affected by the issue' },
  { from: 'Ticket', rel: '[:ASSIGNED_TO]', to: 'Person', desc: 'Owner responsible for resolving the ticket' },
  { from: 'Decision', rel: '[:MADE_BY]', to: 'Person', desc: 'Engineer or architect who authored the decision' },
  { from: 'Decision', rel: '[:ABOUT]', to: 'Project | System', desc: 'Subject affected by the ADR' },
  { from: 'Document', rel: '[:DESCRIBES]', to: 'Project | System', desc: 'Runbooks, specs, and architectural overviews' },
];

export default function SchemaView({ onReseed, isReseeding, dbStatus }) {
  return (
    <motion.div 
      className="schema-view-layout"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="schema-intro-banner">
        <div>
          <h2>Northstar Labs Knowledge Graph Model</h2>
          <p>
            Zero-hallucination graph schema implemented in <strong>FalkorDB</strong>. Every answer is bounded by these exact nodes and edges.
          </p>
        </div>
        <button 
          className="reseed-large-btn" 
          onClick={onReseed}
          disabled={isReseeding}
        >
          <RefreshCw size={15} className={isReseeding ? 'spin-anim' : ''} />
          <span>{isReseeding ? 'Resetting Graph...' : 'Re-seed Graph Data'}</span>
        </button>
      </div>

      <div className="schema-sections-grid">
        {/* Node Labels */}
        <div className="schema-column">
          <div className="column-title">
            <Layers size={16} className="text-purple" />
            <h3>Node Labels ({SCHEMA_NODES.length})</h3>
          </div>

          <div className="nodes-schema-list">
            {SCHEMA_NODES.map((node) => (
              <div key={node.label} className="node-schema-card">
                <div className="node-schema-top">
                  <div className="node-title-group">
                    <span 
                      className="node-color-dot" 
                      style={{ backgroundColor: node.color }}
                    ></span>
                    <strong>{node.label}</strong>
                  </div>
                  <span className="count-pill">{node.count} nodes</span>
                </div>
                <p className="node-schema-desc">{node.desc}</p>
                <div className="props-chips-row">
                  {node.props.map((p) => (
                    <code key={p} className="prop-chip">.{p}</code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationships */}
        <div className="schema-column">
          <div className="column-title">
            <GitFork size={16} className="text-cyan" />
            <h3>Relationship Semantics ({SCHEMA_EDGES.length})</h3>
          </div>

          <div className="edges-schema-list">
            {SCHEMA_EDGES.map((edge, idx) => (
              <div key={idx} className="edge-schema-card">
                <div className="edge-flow-row">
                  <span className="edge-node source">{edge.from}</span>
                  <div className="edge-rel-badge">
                    <code>{edge.rel}</code>
                    <ArrowRight size={12} />
                  </div>
                  <span className="edge-node target">{edge.to}</span>
                </div>
                <p className="edge-desc">{edge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
