// src/components/LeaderboardScreen.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LeaderboardScreen.css';

export default function LeaderboardScreen({ user }) {
  const [board, setBoard]     = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate               = useNavigate();

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => setBoard(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const renderBar = (score) => {
    const pct = (score / 10) * 100;
    return (
      <div className="score-bar-container">
        <div className="score-bar" style={{ width: `${pct}%` }} />
        <span className="score-value">{score}</span>
      </div>
    );
  };

  return (
    <div className="analysis-screen">
      <div className="header">
        <button onClick={() => navigate(-1)}>Back</button>
        <h2>Toxicity Leaderboard</h2>
      </div>
      <div className="analysis-content">
        {loading ? (
          <div className="loading">Loading leaderboard…</div>
        ) : (
          board.map(({ conversationId, participants, toxicity, leaderboardSummary }) => (
            <div
              key={conversationId}
              className="analysis-section"
              onClick={() => navigate(`/analysis/${conversationId}`)}
              style={{ cursor: 'pointer' }}
            >
              <h3>{participants.join(' & ')}</h3>
              {renderBar(toxicity)}
              <p className="summary">{leaderboardSummary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
