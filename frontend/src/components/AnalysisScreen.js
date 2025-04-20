
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/AnalysisScreen.css';

function AnalysisScreen({ user }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { conversationId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    analyzeConversation();
  }, [conversationId]);

  const analyzeConversation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze conversation');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderScoreBar = (score) => {
    const percentage = (score / 10) * 100;
    return (
      <div className="score-bar-container">
        <div className="score-bar" style={{ width: `${percentage}%` }}></div>
        <span className="score-value">{score}</span>
      </div>
    );
  };

  return (
    <div className="analysis-screen">
      <div className="header">
        <button onClick={() => navigate(`/messages/${conversationId}`)}>Back</button>
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
              <h3>Keirsey's Temperaments</h3>
              <div className="temperaments">
                <div className="score-item">
                  <div className="score-label">Artisan</div>
                  {renderScoreBar(analysis.temperaments.artisan)}
                </div>
                <div className="score-item">
                  <div className="score-label">Guardian</div>
                  {renderScoreBar(analysis.temperaments.guardian)}
                </div>
                <div className="score-item">
                  <div className="score-label">Idealist</div>
                  {renderScoreBar(analysis.temperaments.idealist)}
                </div>
                <div className="score-item">
                  <div className="score-label">Rational</div>
                  {renderScoreBar(analysis.temperaments.rational)}
                </div>
              </div>
            </div>
            
            <div className="analysis-section">
              <h3>Emotional Aspects</h3>
              <div className="emotional-aspects">
                {Object.entries(analysis.emotional_aspects).map(([aspect, score]) => (
                  <div key={aspect} className="score-item">
                    <div className="score-label">{aspect.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
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