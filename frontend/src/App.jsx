import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import DemoPrompts from './components/DemoPrompts';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import GraphExplorer from './components/GraphExplorer';
import CypherPlayground from './components/CypherPlayground';
import SchemaView from './components/SchemaView';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'explorer' | 'cypher' | 'schema'
  const [messages, setMessages] = useState([
    { id: 'welcome', type: 'welcome' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState({ status: 'connecting' });
  const [graphStats, setGraphStats] = useState({ nodes: {}, relationships: {} });
  const [isReseeding, setIsReseeding] = useState(false);
  const [llmActive, setLlmActive] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isLoading, activeTab]);

  // Fetch health and graph statistics
  const fetchStatusAndStats = async () => {
    try {
      const healthRes = await fetch('/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbStatus(healthData);
      } else {
        setDbStatus({ status: 'error', falkordb: 'error' });
      }

      const statsRes = await fetch('/graph/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setGraphStats(statsData);
      }
    } catch (err) {
      console.error('Failed to connect to FalkorDB backend:', err);
      setDbStatus({ status: 'error', falkordb: 'error' });
    }
  };

  useEffect(() => {
    fetchStatusAndStats();
    const interval = setInterval(fetchStatusAndStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Ask / Submit query
  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || isLoading) return;

    setActiveTab('chat'); // ensure we are in chat view
    const userMsgId = 'user-' + Date.now();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, type: 'user', text: queryText, timestamp },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status HTTP ${response.status}`);
      }

      const result = await response.json();
      setLlmActive(!!result.llm_active);

      const agentMsgId = 'agent-' + Date.now();
      setMessages((prev) => [
        ...prev,
        { id: agentMsgId, type: 'agent', data: result },
      ]);
    } catch (err) {
      console.error('Agent query error:', err);
      const errorMsgId = 'error-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          type: 'error',
          error: err.message || 'Error executing Cypher query against FalkorDB.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-seed Graph handler
  const handleReseed = async () => {
    if (!window.confirm('Reset and re-seed the Northstar Labs graph in FalkorDB with original sample data?')) {
      return;
    }
    setIsReseeding(true);
    try {
      const res = await fetch('/graph/reseed', { method: 'POST' });
      const data = await res.json();
      alert(data.message || 'Northstar graph reset successfully!');
      await fetchStatusAndStats();
    } catch (err) {
      alert('Failed to reset graph: ' + err.message);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="app-layout">
      {/* 1. Header with Tab Navigation */}
      <Header
        dbStatus={dbStatus}
        onReseed={handleReseed}
        isReseeding={isReseeding}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Tab Content Area */}
      <main className="main-content-wrapper">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && (
            <motion.div 
              key="chat-tab"
              className="tab-pane-chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <section className="chat-section">
                {/* Quick Demo Prompts */}
                <DemoPrompts
                  onSelectPrompt={handleSendMessage}
                  disabled={isLoading}
                />

                {/* Conversation History */}
                <div className="conversation-container">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}

                  {isLoading && (
                    <ChatMessage message={{ type: 'loading' }} />
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Sticky Input */}
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  llmActive={llmActive}
                />
              </section>

              {/* Right Sidebar: Graph Metrics & Schema Legend */}
              <Sidebar
                stats={graphStats}
                onSelectSample={handleSendMessage}
              />
            </motion.div>
          )}

          {activeTab === 'explorer' && (
            <motion.div 
              key="explorer-tab"
              className="tab-pane-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GraphExplorer onAskAbout={handleSendMessage} />
            </motion.div>
          )}

          {activeTab === 'cypher' && (
            <motion.div 
              key="cypher-tab"
              className="tab-pane-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CypherPlayground />
            </motion.div>
          )}

          {activeTab === 'schema' && (
            <motion.div 
              key="schema-tab"
              className="tab-pane-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SchemaView
                onReseed={handleReseed}
                isReseeding={isReseeding}
                dbStatus={dbStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div>
            <strong>Who Knows What</strong> · Built for{' '}
            <a
              href="https://www.wemakedevs.org/hackathons/falkordb"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Graph Hacks: Context for AI Agents
            </a>{' '}
            (WeMakeDevs × FalkorDB) · Track 03: Company Brain (Solo)
          </div>
          <div>
            Author: <a href="https://github.com/Tayal01" target="_blank" rel="noopener noreferrer" className="footer-link">@Tayal01</a> · Engine:{' '}
            <code>FalkorDB :6379</code> · Graph: <code>northstar</code>
          </div>
        </div>
      </footer>
    </div>
  );
}
