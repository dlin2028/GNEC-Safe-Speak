
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/MessageScreen.css';

function MessageScreen({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherParticipant, setOtherParticipant] = useState('');
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // Fetch messages every 2 seconds (simulating real-time updates)
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      // Fetch conversation details to get other participant
      const convResponse = await fetch(`/api/conversations?userId=${user.userId}`);
      const conversations = await convResponse.json();
      const currentConv = conversations.find(conv => conv.id === conversationId);
      if (currentConv) {
        setOtherParticipant(currentConv.otherParticipant);
      }
      
      // Fetch messages
      const msgResponse = await fetch(`/api/messages/${conversationId}`);
      const data = await msgResponse.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          senderId: user.userId,
          content: newMessage,
        }),
      });
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="message-screen">
      <div className="header">
        <button onClick={() => navigate('/conversations')}>Back</button>
        <h2>{otherParticipant}</h2>
        <button 
          onClick={() => navigate(`/analysis/${conversationId}`)}
          className="analyze-button"
        >
          Analyze
        </button>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.senderId === user.userId ? 'sent' : 'received'}`}
          >
            <div className="message-bubble">
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="message-input">
        <input
          type="text"
          placeholder="Message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default MessageScreen;