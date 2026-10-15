import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Server, 
  FolderGit2, 
  Ticket, 
  Scale, 
  FileText, 
  Search, 
  Filter, 
  Layers,
  ChevronRight,
  ExternalLink,
  Code
} from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All Entities', icon: Layers, count: 46 },
  { id: 'Person', label: 'People', icon: Users, color: '#38bdf8' },
  { id: 'System', label: 'Systems', icon: Server, color: '#f43f5e' },
  { id: 'Project', label: 'Projects', icon: FolderGit2, color: '#a78bfa' },
  { id: 'Ticket', label: 'Tickets', icon: Ticket, color: '#34d399' },
  { id: 'Decision', label: 'Decisions', icon: Scale, color: '#fbbf24' },
  { id: 'Document', label: 'Documents', icon: FileText, color: '#818cf8' },
];

export default function GraphExplorer({ onAskAbout }) {
  const [selectedLabel, setSelectedLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetchNodes(selectedLabel);
  }, [selectedLabel]);

  const fetchNodes = async (label) => {
    setIsLoading(true);
    try {
      const url = label ? `/graph/nodes?label=${label}` : '/graph/nodes';
      const res = await fetch(url);
      const data = await res.json();
      setNodes(data.nodes || []);
      if (data.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      } else {
        setSelectedNode(null);
      }
    } catch (err) {
      console.error('Error fetching nodes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNodes = nodes.filter((node) => {
    const props = node.properties || {};
    const nameStr = props.name || props.title || props.key || '';
    const descStr = props.role || props.summary || props.criticality || props.skills || '';
    const fullText = `${nameStr} ${descStr} ${node.label}`.toLowerCase();
    return fullText.includes(searchQuery.toLowerCase());
  });

  const getBadgeColor = (label) => {
    switch (label) {
      case 'Person': return 'pill-person';
      case 'System': return 'pill-system';
      case 'Project': return 'pill-project';
      case 'Ticket': return 'pill-ticket';
      case 'Decision': return 'pill-decision';
      default: return 'pill-doc';
    }
  };

  return (
    <motion.div 
      className="explorer-layout"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Category selector strip */}
      <div className="explorer-categories">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedLabel === cat.id;
          return (
            <button
              key={cat.id}
              className={`cat-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedLabel(cat.id)}
            >
              <Icon size={14} style={{ color: cat.color || 'inherit' }} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div className="explorer-body-grid">
        {/* Left Column: Node List & Search */}
        <div className="explorer-list-panel">
          <div className="search-bar-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search entities, roles, systems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="explorer-search-input"
            />
            {searchQuery && (
              <span className="results-badge">{filteredNodes.length}</span>
            )}
          </div>

          <div className="nodes-scroll-container">
            {isLoading ? (
              <div className="explorer-loading">
                <div className="mini-spinner"></div>
                <span>Fetching FalkorDB Entities...</span>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="explorer-empty">
                <p>No entities found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredNodes.map((n, idx) => {
                const props = n.properties || {};
                const name = props.name || props.title || props.key || 'Entity';
                const subtitle = props.role || props.status || props.criticality || props.decided_on || '';
                const isSelected = selectedNode === n;

                return (
                  <motion.div
                    key={idx}
                    className={`node-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedNode(n)}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="node-card-top">
                      <span className={`node-pill ${getBadgeColor(n.label)}`}>
                        {n.label}
                      </span>
                      <ChevronRight size={14} className="node-chevron" />
                    </div>
                    <div className="node-card-title">{name}</div>
                    {subtitle && <div className="node-card-sub">{subtitle}</div>}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Node Details Inspector */}
        <div className="explorer-detail-panel">
          {selectedNode ? (
            <div className="detail-card">
              <div className="detail-header">
                <div>
                  <span className={`node-pill ${getBadgeColor(selectedNode.label)}`}>
                    {selectedNode.label}
                  </span>
                  <h2 className="detail-title">
                    {selectedNode.properties?.name ||
                      selectedNode.properties?.title ||
                      selectedNode.properties?.key}
                  </h2>
                </div>

                {onAskAbout && (
                  <button
                    className="ask-agent-chip"
                    onClick={() => {
                      const name = selectedNode.properties?.name || selectedNode.properties?.title || selectedNode.properties?.key;
                      onAskAbout(`Tell me about ${selectedNode.label.toLowerCase()} ${name}`);
                    }}
                  >
                    <span>Ask Brain About This</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>

              <div className="props-table-wrapper">
                <h3>Entity Properties (FalkorDB Graph)</h3>
                <table className="props-table">
                  <tbody>
                    {Object.entries(selectedNode.properties || {}).map(([key, val]) => (
                      <tr key={key}>
                        <td className="prop-key">{key}</td>
                        <td className="prop-val">
                          {Array.isArray(val) ? (
                            <div className="tags-list">
                              {val.map((item, i) => (
                                <span key={i} className="skill-tag">
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            String(val)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="suggested-queries-box">
                <h4>Suggested Questions for Brain:</h4>
                <div className="suggested-chips">
                  {selectedNode.label === 'Person' && (
                    <>
                      <button onClick={() => onAskAbout(`What projects does ${selectedNode.properties.name} work on?`)}>
                        "What projects does {selectedNode.properties.name} work on?"
                      </button>
                      <button onClick={() => onAskAbout(`What systems are owned by ${selectedNode.properties.name}?`)}>
                        "What systems does {selectedNode.properties.name} own?"
                      </button>
                    </>
                  )}
                  {selectedNode.label === 'System' && (
                    <>
                      <button onClick={() => onAskAbout(`If ${selectedNode.properties.name} goes down, what else breaks?`)}>
                        "Blast radius if {selectedNode.properties.name} goes down?"
                      </button>
                      <button onClick={() => onAskAbout(`Who owns ${selectedNode.properties.name}?`)}>
                        "Who owns {selectedNode.properties.name}?"
                      </button>
                    </>
                  )}
                  {selectedNode.label === 'Project' && (
                    <button onClick={() => onAskAbout(`Who works on ${selectedNode.properties.name}?`)}>
                      "Who works on {selectedNode.properties.name}?"
                    </button>
                  )}
                  {selectedNode.label === 'Ticket' && (
                    <button onClick={() => onAskAbout(`Who is assigned to ${selectedNode.properties.key}?`)}>
                      "Who is assigned to {selectedNode.properties.key}?"
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="detail-empty">
              <Layers size={32} className="empty-icon" />
              <p>Select any entity to view its graph properties</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
