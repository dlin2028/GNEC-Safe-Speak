// src/components/MessageScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../styles/MessageScreen.css';

function MessageScreen({ user }) {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Try to read the other participant from route state if provided
  const initialOther = location.state?.otherParticipant || '';

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherParticipant, setOtherParticipant] = useState(initialOther);
  const messagesEndRef = useRef(null);

  // Fetch otherParticipant once on mount if not provided
  useEffect(() => {
    if (!initialOther) {
      fetchOtherParticipant();
    }
  }, [conversationId]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 2000);
    // also fetch immediately
    fetchMessages();
    return () => clearInterval(interval);
  }, [conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchOtherParticipant() {
    try {
      const resp = await fetch(`/api/conversations?userId=${user.userId}`);
      const convs = await resp.json();
      const conv = convs.find(c => c.id === conversationId);
      if (conv && conv.otherParticipant) {
        setOtherParticipant(conv.otherParticipant);
      }
    } catch (err) {
      console.error('Error fetching conversation info:', err);
    }
  }

  async function fetchMessages() {
    try {
      const resp = await fetch(`/api/messages/${conversationId}`);
      const data = await resp.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId: user.userId,
          content: newMessage,
        }),
      });

      setNewMessage('');
      // immediately fetch new messages
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="message-screen">
      <div className="header">
        <button onClick={() => navigate('/conversations')}>Back</button>
        <h2>{otherParticipant}</h2>
        <button onClick={() => navigate(`/analysis/${conversationId}`)} className="analyze-button">
          Analyze
        </button>
      </div>

      <div className="messages-container">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message ${msg.senderId === user.userId ? 'sent' : 'received'}`}
          >
            <div className="message-bubble">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-input">
        <input
          type="text"
          placeholder="Message"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default MessageScreen;
