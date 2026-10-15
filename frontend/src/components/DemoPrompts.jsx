import React from 'react';
import { Users, AlertTriangle, Scale, Ticket, Sparkles } from 'lucide-react';

const DEMO_QUESTIONS = [
  {
    icon: Users,
    iconColor: '#38bdf8',
    title: 'Who worked on Payments?',
    subtitle: 'Find owners, contributors & cross-team links',
    query: 'Who has worked on the payments system before?',
  },
  {
    icon: AlertTriangle,
    iconColor: '#f43f5e',
    title: 'Login Blast Radius',
    subtitle: 'Downstream services, affected apps & on-call',
    query: 'If Login goes down, what else breaks, and who do I ping?',
  },
  {
    icon: Scale,
    iconColor: '#a78bfa',
    title: '2FA Architecture Decision',
    subtitle: 'Decision log, author, rationale & date',
    query: 'What did we decide about 2FA last month, and who decided it?',
  },
  {
    icon: Ticket,
    iconColor: '#34d399',
    title: 'Open Tickets on Payments',
    subtitle: 'Jira-like tickets, status & assignees',
    query: 'Which open tickets are about Payments, and who owns them?',
  },
];

export default function DemoPrompts({ onSelectPrompt, disabled }) {
  return (
    <div className="demo-strip">
      <div className="strip-header">
        <div className="strip-title-row">
          <Sparkles size={16} className="sparkle-icon" />
          <span className="strip-title">Try Hackathon Demo Questions:</span>
        </div>
        <span className="strip-hint">Click any question for instant FalkorDB graph traversal</span>
      </div>

      <div className="demo-buttons-grid">
        {DEMO_QUESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className="demo-card-btn"
              onClick={() => onSelectPrompt(item.query)}
              disabled={disabled}
              title={item.query}
            >
              <div className="demo-icon-wrapper" style={{ color: item.iconColor }}>
                <Icon size={20} />
              </div>
              <div className="demo-text">
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
