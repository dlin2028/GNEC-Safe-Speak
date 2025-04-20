
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ConversationsScreen.css';

function ConversationsScreen({ user }) {
  const [conversations, setConversations] = useState([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [recipientNumber, setRecipientNumber] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/conversations?userId=${user.userId}`);
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleConversationClick = (conversationId) => {
    navigate(`/messages/${conversationId}`);
  };

  const handleNewChat = async () => {
    try {
      // Create conversation
      const convResponse = await fetch('http://localhost:5000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          recipient: recipientNumber,
        }),
      });
      
      const convData = await convResponse.json();
      
      // Send initial message if any
      if (initialMessage.trim() !== '') {
        await fetch('http://localhost:5000/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: convData.conversationId,
            senderId: user.userId,
            content: initialMessage,
          }),
        });
      }
      
      // Close modal and refresh conversations
      setIsNewChatModalOpen(false);
      setRecipientNumber('');
      setInitialMessage('');
      fetchConversations();
      
      // Navigate to the conversation
      navigate(`/messages/${convData.conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className="conversations-screen">
      <div className="header">
        <h1>Messages</h1>
        <button onClick={() => setIsNewChatModalOpen(true)}>New Message</button>
      </div>
      
      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conversation) => (
            <div 
              key={conversation.id} 
              className="conversation-item"
              onClick={() => handleConversationClick(conversation.id)}
            >
              <div className="conversation-details">
                <h2>{conversation.otherParticipant}</h2>
                <p>{conversation.lastMessage || 'No messages yet'}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {isNewChatModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>New Message</h2>
            <input
              type="tel"
              placeholder="Recipient Phone Number"
              value={recipientNumber}
              onChange={(e) => setRecipientNumber(e.target.value)}
            />
            <textarea
              placeholder="Message (optional)"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={() => setIsNewChatModalOpen(false)}>Cancel</button>
              <button onClick={handleNewChat}>Start Chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationsScreen;
