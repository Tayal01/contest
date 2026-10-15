import React from 'react';
import { Database, ExternalLink, RefreshCw, MessageSquare, Compass, Terminal, Layers, Sparkles } from 'lucide-react';

export default function Header({ 
  dbStatus, 
  onReseed, 
  isReseeding, 
  activeTab, 
  setActiveTab 
}) {
  const isConnected = dbStatus.status === 'ok' && dbStatus.falkordb === 'connected';

  const tabs = [
    { id: 'chat', label: 'AI Agent Chat', icon: MessageSquare },
    { id: 'explorer', label: 'Graph Explorer', icon: Compass },
    { id: 'cypher', label: 'Cypher Sandbox', icon: Terminal },
    { id: 'schema', label: 'Database Schema', icon: Layers },
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-icon">
          <Database size={22} className="logo-svg" />
        </div>
        <div className="brand-titles">
          <div className="brand-title-row">
            <h1>Who Knows What</h1>
            <span className="badge-tag">Track 03 — Company Brain</span>
          </div>
          <p className="subtitle">
            Northstar Labs Knowledge Graph on <strong>FalkorDB</strong>
          </p>
        </div>
      </div>

      {/* Modern SaaS Navigation Tabs */}
      <nav className="header-nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {isActive && <span className="tab-active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Header Actions */}
      <div className="header-actions">
        <div className={`status-indicator ${isConnected ? 'connected' : 'error'}`} id="db-status-pill">
          <span className="pulse-dot"></span>
          <span className="status-text">
            {isConnected
              ? `FalkorDB Connected (${dbStatus.total_nodes || 46} nodes)`
              : 'Connecting to FalkorDB...'}
          </span>
        </div>

        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn secondary-btn"
          title="Open official FalkorDB Browser"
        >
          <ExternalLink size={14} />
          <span>FalkorDB Studio (:3000)</span>
        </a>

        <button
          onClick={onReseed}
          disabled={isReseeding}
          className="nav-btn ghost-btn"
          title="Re-seed Northstar Graph with fresh sample data"
        >
          <RefreshCw size={14} className={isReseeding ? 'spin-anim' : ''} />
          <span>{isReseeding ? 'Resetting...' : 'Reset Graph'}</span>
        </button>

        <a
          href="https://github.com/Tayal01"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn github-btn"
          title="Author Profile @Tayal01"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
            <path d="M9 18c-4.51 2-5-2-7-2"></path>
          </svg>
          <span>@Tayal01</span>
        </a>
      </div>
    </header>
  );
}
