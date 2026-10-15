import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DemoPrompts from './components/DemoPrompts';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import './App.css';

export default function App() {
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
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch initial health and graph statistics
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

    const userMsgId = 'user-' + Date.now();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message & loading card
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
      {/* 1. Header */}
      <Header
        dbStatus={dbStatus}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      {/* 2. Main Workspace (Chat + Sidebar) */}
      <main className="main-content">
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
