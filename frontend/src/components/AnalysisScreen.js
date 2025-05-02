// src/components/AnalysisScreen.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/AnalysisScreen.css';

const temperamentDescriptions = {
  artisan:  "Practical and spontaneous—excels in hands-on problem solving.",
  guardian: "Dependable and organized—values stability and community.",
  idealist: "Empathetic and enthusiastic—seeks growth and harmony.",
  rational: "Strategic and analytical—focuses on competence and vision."
};

function AnalysisScreen({ user }) {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showDesc, setShowDesc] = useState({});

  useEffect(() => {
    analyzeConversation();
  }, [conversationId]);

  const analyzeConversation = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, userId: user.userId })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Analysis failed');
      }
      setAnalysis(await resp.json());
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderScoreBar = (score) => {
    const pct = (score / 10) * 100;
    return (
      <div className="score-bar-container">
        <div className="score-bar" style={{ width: `${pct}%` }} />
        <span className="score-value">{score}</span>
      </div>
    );
  };

  const renderTemperaments = (who) => (
    <div className="temperaments">
      {Object.entries(analysis.temperaments[who]).map(([type, score]) => (
        <div key={type} className="score-item">
          <div className="score-label">
            {type.charAt(0).toUpperCase() + type.slice(1)}
            <button
              className="info-button"
              onClick={() =>
                setShowDesc(d => ({
                  ...d,
                  [`${who}-${type}`]: !d[`${who}-${type}`]
                }))
              }
            >
              ℹ️
            </button>
          </div>
          {showDesc[`${who}-${type}`] && (
            <p className="description">{temperamentDescriptions[type]}</p>
          )}
          {renderScoreBar(score)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="analysis-screen">
      <div className="header">
        <button onClick={() => navigate(`/messages/${conversationId}`)}>
          Back
        </button>
        <h2>Conversation Analysis</h2>
      </div>

      <div className="analysis-content">
        {loading ? (
          <div className="loading">Analyzing conversation...</div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <button onClick={analyzeConversation}>Try Again</button>
          </div>
        ) : analysis ? (
          <>
            <div className="analysis-section">
              <h3>Your Temperaments</h3>
              {analysis.is_trafficker && (
                <div className="warning trafficker-warning">
                  ⚠️ <strong>Warning:</strong> Signs that the other participant may be a trafficker.
                </div>
              )}
              {renderTemperaments('you')}
            </div>

            <div className="analysis-section">
              <h3>Other’s Temperaments</h3>
              {renderTemperaments('other')}
            </div>

            <div className="analysis-section">
              <h3>Emotional Aspects</h3>
              <div className="emotional-aspects">
                {Object.entries(analysis.emotional_aspects).map(([asp, score]) => (
                  <div key={asp} className="score-item">
                    <div className="score-label">
                      {asp.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    {renderScoreBar(score)}
                  </div>
                ))}
              </div>
            </div>

            <div className="analysis-section">
              <h3>Summary</h3>
              <p className="summary">{analysis.summary}</p>
            </div>
          </>
        ) : (
          <div className="no-data">No analysis data available</div>
        )}
      </div>
    </div>
  );
}

export default AnalysisScreen;
