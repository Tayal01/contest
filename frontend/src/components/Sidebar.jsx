import React from 'react';
import { 
  Users, 
  Server, 
  FolderGit2, 
  Ticket, 
  Scale, 
  FileText, 
  Layers, 
  GitFork, 
  Info,
  Activity
} from 'lucide-react';

export default function Sidebar({ stats, onSelectSample }) {
  const nodeCounts = stats?.nodes || {};
  
  const metrics = [
    { label: 'People', count: nodeCounts.Person ?? 12, icon: Users, color: '#38bdf8' },
    { label: 'Systems', count: nodeCounts.System ?? 6, icon: Server, color: '#f43f5e' },
    { label: 'Projects', count: nodeCounts.Project ?? 5, icon: FolderGit2, color: '#a78bfa' },
    { label: 'Tickets', count: nodeCounts.Ticket ?? 8, icon: Ticket, color: '#34d399' },
    { label: 'Decisions', count: nodeCounts.Decision ?? 5, icon: Scale, color: '#fbbf24' },
    { label: 'Documents', count: nodeCounts.Document ?? 6, icon: FileText, color: '#818cf8' },
  ];

  const sampleChains = [
    { source: 'Asha Patel', rel: '[:OWNS]', target: 'Login', query: 'Who owns Login?' },
    { source: 'App API', rel: '[:DEPENDS_ON]', target: 'Login', query: 'What depends on Login?' },
    { source: 'Payments', rel: '[:USES]', target: 'Ledger', query: 'What does Payments use?' },
    { source: 'Rohan Sharma', rel: '[:WORKS_ON]', target: 'Payments', query: 'Who has worked on the payments system before?' },
    { source: 'PAY-18', rel: '[:ABOUT]', target: 'Payments', query: 'Which open tickets are about Payments?' },
  ];

  return (
    <aside className="sidebar-section">
      {/* 1. Live Graph Metrics */}
      <div className="sidebar-card">
        <div className="card-header">
          <div className="card-header-title">
            <Layers size={16} className="purple" />
            <h3>Northstar Graph Metrics</h3>
          </div>
          <span className="live-pill">
            <Activity size={12} className="pulse-icon" />
            Live
          </span>
        </div>

        <div className="metrics-grid">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="metric-box">
                <div className="metric-top">
                  <span className="metric-number" style={{ color: m.color }}>
                    {m.count}
                  </span>
                  <Icon size={16} style={{ color: m.color, opacity: 0.8 }} />
                </div>
                <span className="metric-label">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Schema Legend */}
      <div className="sidebar-card">
        <div className="card-header">
          <div className="card-header-title">
            <GitFork size={16} className="cyan" />
            <h3>Graph Schema Legend</h3>
          </div>
        </div>

        <div className="schema-legend">
          <div className="legend-row">
            <span className="node-pill pill-person">Person</span>
            <span className="legend-desc">Engineers, PMs, QA & Owners</span>
          </div>
          <div className="legend-row">
            <span className="node-pill pill-system">System</span>
            <span className="legend-desc">Login, Ledger, Notify, App API...</span>
          </div>
          <div className="legend-row">
            <span className="node-pill pill-project">Project</span>
            <span className="legend-desc">Payments, Mobile App, Infra...</span>
          </div>
          <div className="legend-row">
            <span className="node-pill pill-decision">Decision</span>
            <span className="legend-desc">Architectural ADRs & 2FA choices</span>
          </div>
          <div className="legend-row">
            <span className="node-pill pill-ticket">Ticket</span>
            <span className="legend-desc">Jira bugs, tasks & assignees</span>
          </div>

          <div className="legend-divider"></div>
          <div className="rel-labels-row">
            <code>[:OWNS]</code>
            <code>[:WORKS_ON]</code>
            <code>[:DEPENDS_ON]</code>
            <code>[:USES]</code>
            <code>[:ABOUT]</code>
          </div>
        </div>
      </div>

      {/* 3. Sample Relationships Explorer */}
      <div className="sidebar-card">
        <div className="card-header">
          <div className="card-header-title">
            <Info size={16} className="emerald" />
            <h3>FalkorDB Topology Links</h3>
          </div>
          <span className="hint-tag">Sample</span>
        </div>

        <div className="graph-chains-list">
          {sampleChains.map((c, idx) => (
            <button
              key={idx}
              className="chain-item-btn"
              onClick={() => onSelectSample && onSelectSample(c.query)}
              title={`Ask: "${c.query}"`}
            >
              <span className="chain-source">{c.source}</span>
              <span className="chain-rel">{c.rel}</span>
              <span className="chain-target">{c.target}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
