import React, { useState } from 'react';
import { Send, Sparkles, X, Database } from 'lucide-react';

export default function ChatInput({ onSendMessage, isLoading, llmActive }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;
    onSendMessage(query);
    setInput('');
  };

  return (
    <div className="chat-input-wrapper">
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-field-container">
          <input
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g. 'Who owns Ledger?', 'If Notify dies what breaks?', '2FA decision')..."
            disabled={isLoading}
            autoFocus
          />
          {input && (
            <button
              type="button"
              className="clear-input-btn"
              onClick={() => setInput('')}
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="send-btn"
          disabled={!input.trim() || isLoading}
          title="Send query to FalkorDB Agent"
        >
          <span>Ask Brain</span>
          <Send size={15} />
        </button>
      </form>

      <div className="input-meta-bar">
        <div className="meta-left">
          <Database size={13} className="text-cyan" />
          <span>
            Database Engine: <strong>FalkorDB</strong> (:6379) · Graph: <code>northstar</code>
          </span>
        </div>
        <div className="meta-right">
          <span className={`llm-status-pill ${llmActive ? 'active' : 'direct'}`}>
            <Sparkles size={12} />
            {llmActive ? 'LLM Tool Calling Active' : 'Direct FalkorDB Mode'}
          </span>
        </div>
      </div>
    </div>
  );
}
