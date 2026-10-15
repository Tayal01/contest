import React, { useState } from 'react';
import { 
  Bot, 
  User, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Terminal, 
  Table as TableIcon,
  Cpu,
  ShieldAlert,
  Compass,
  Zap
} from 'lucide-react';

export default function ChatMessage({ message }) {
  const [copiedCypher, setCopiedCypher] = useState(false);
  const [showCypher, setShowCypher] = useState(true);
  const [showRows, setShowRows] = useState(false);

  // 1. Welcome Card
  if (message.type === 'welcome') {
    return (
      <div className="message-card agent-welcome">
        <div className="card-avatar agent-avatar">
          <Bot size={22} />
        </div>
        <div className="card-body">
          <div className="card-header-line">
            <div className="sender-tag">
              <strong>Who Knows What — Agent</strong>
              <span className="agent-badge">Company Brain</span>
            </div>
            <span className="time-badge">Ready</span>
          </div>
          <p className="welcome-desc">
            Welcome! I am Northstar Labs' Company Brain. Every answer I generate is{' '}
            <strong>strictly grounded and traversed through FalkorDB</strong>.
          </p>
          <div className="rules-callout">
            <div className="rule-item">
              <ShieldAlert size={16} className="rule-icon purple" />
              <div>
                <strong>Zero Hallucinations:</strong> If an employee, ticket, or system dependency isn't in FalkorDB, it doesn't exist.
              </div>
            </div>
            <div className="rule-item">
              <Compass size={16} className="rule-icon cyan" />
              <div>
                <strong>Mandatory Path Citing:</strong> Every answer visualizes the exact graph traversal chain used to find the truth.
              </div>
            </div>
            <div className="rule-item">
              <Zap size={16} className="rule-icon emerald" />
              <div>
                <strong>FalkorDB Graph Engine:</strong> Sub-millisecond graph queries via Cypher on port <code>6379</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. User Message
  if (message.type === 'user') {
    return (
      <div className="message-card user-message-card">
        <div className="card-avatar user-avatar">
          <User size={20} />
        </div>
        <div className="card-body">
          <div className="card-header-line">
            <strong>You</strong>
            <span className="time-badge">{message.timestamp || 'Just now'}</span>
          </div>
          <div className="user-text">{message.text}</div>
        </div>
      </div>
    );
  }

  // 3. Loading Skeleton
  if (message.type === 'loading') {
    return (
      <div className="message-card agent-response-card loading-card">
        <div className="card-avatar agent-avatar pulse-avatar">
          <Bot size={22} />
        </div>
        <div className="card-body">
          <div className="card-header-line">
            <strong>Who Knows What — Agent</strong>
            <span className="tool-badge-pill querying">
              <span className="mini-spinner"></span>
              Traversing FalkorDB Graph...
            </span>
          </div>
          <div className="loading-skeleton">
            <div className="skeleton-line" style={{ width: '85%' }}></div>
            <div className="skeleton-line" style={{ width: '65%' }}></div>
            <div className="skeleton-line" style={{ width: '92%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Error Message
  if (message.type === 'error') {
    return (
      <div className="message-card error-card">
        <div className="card-avatar error-avatar">⚠️</div>
        <div className="card-body">
          <div className="card-header-line">
            <strong style={{ color: '#fca5a5' }}>Agent Query Error</strong>
          </div>
          <p style={{ color: '#fca5a5' }}>{message.error || 'Failed to query FalkorDB.'}</p>
        </div>
      </div>
    );
  }

  // 5. Agent Response Card
  const { data } = message;
  const toolName = data?.tool_used || 'cypher_tool';
  const answer = data?.answer || 'No response provided.';
  const cypher = data?.cypher_used || '';
  const paths = data?.paths || [];
  const rows = data?.rows || [];
  const rowCount = data?.count ?? rows.length;
  const llmActive = data?.llm_active;

  const handleCopyCypher = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cypher);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  const renderPathSegments = (pathStr) => {
    // Regex splits path segments: Asha Patel —[:OWNS]→ Login ←[:DEPENDS_ON]— App API
    const parts = pathStr.split(/(—\[:.*?\]→|←\[:.*?\]—)/g);
    return parts.map((part, i) => {
      if (part.startsWith('—[:') || part.startsWith('←[:')) {
        return (
          <span key={i} className="path-arrow">
            <code>{part}</code>
          </span>
        );
      } else {
        const trimmed = part.trim();
        if (!trimmed) return null;
        return (
          <span key={i} className="path-node">
            {trimmed}
          </span>
        );
      }
    });
  };

  return (
    <div className="message-card agent-response-card">
      <div className="card-avatar agent-avatar">
        <Bot size={22} />
      </div>

      <div className="card-body">
        {/* Header line with Tool & LLM pills */}
        <div className="card-header-line">
          <div className="sender-tag">
            <strong>Who Knows What</strong>
            <span className="tool-badge-pill">
              <Cpu size={12} />
              Tool: <code>{toolName}</code>
            </span>
          </div>

          <div className="meta-badges">
            <span className={`mode-badge ${llmActive ? 'llm' : 'direct'}`}>
              {llmActive ? 'LLM Agent' : 'Direct FalkorDB'}
            </span>
            <span className="rows-count-badge">{rowCount} results</span>
          </div>
        </div>

        {/* Natural Language Answer */}
        <div className="agent-answer-text">
          {answer.split('\n').map((line, idx) => (
            <p key={idx} className={line.startsWith('•') ? 'bullet-point' : ''}>
              {line}
            </p>
          ))}
        </div>

        {/* 1. Traversal Path Visualizer */}
        {paths && paths.length > 0 && (
          <div className="path-visualizer-box">
            <div className="box-title">
              <Share2 size={15} className="title-icon cyan" />
              <span>
                Graph Traversal Path Cites (<strong>{paths.length}</strong> paths)
              </span>
            </div>
            <div className="paths-list">
              {paths.map((p, idx) => (
                <div key={idx} className="graph-path-row">
                  <span className="path-index">{idx + 1}</span>
                  <div className="path-nodes-chain">{renderPathSegments(p)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Collapsible Cypher Inspector */}
        {cypher && (
          <div className="inspector-card">
            <div className="inspector-header" onClick={() => setShowCypher(!showCypher)}>
              <div className="inspector-title">
                <Terminal size={14} className="title-icon purple" />
                <span>Cypher Query Executed on FalkorDB</span>
              </div>
              <div className="inspector-actions">
                <button
                  type="button"
                  className="copy-btn"
                  onClick={handleCopyCypher}
                  title="Copy Cypher Query"
                >
                  {copiedCypher ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copiedCypher ? 'Copied' : 'Copy'}</span>
                </button>
                {showCypher ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {showCypher && (
              <div className="inspector-body">
                <pre className="cypher-code-block">
                  <code>{cypher}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 3. Collapsible Raw Rows Table */}
        {rows && rows.length > 0 && (
          <div className="inspector-card">
            <div className="inspector-header" onClick={() => setShowRows(!showRows)}>
              <div className="inspector-title">
                <TableIcon size={14} className="title-icon emerald" />
                <span>FalkorDB Raw Result Rows ({rows.length})</span>
              </div>
              <div className="inspector-actions">
                {showRows ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {showRows && (
              <div className="inspector-body table-body">
                <div className="table-responsive">
                  <table className="data-table-preview">
                    <thead>
                      <tr>
                        {Object.keys(rows[0]).map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 15).map((row, rIdx) => (
                        <tr key={rIdx}>
                          {Object.keys(rows[0]).map((h) => {
                            const val = row[h];
                            const cellStr = Array.isArray(val)
                              ? val.join(', ')
                              : typeof val === 'object' && val !== null
                              ? JSON.stringify(val)
                              : String(val ?? '');
                            return <td key={h}>{cellStr}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
