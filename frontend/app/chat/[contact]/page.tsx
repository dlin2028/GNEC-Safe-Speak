'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Chat() {
  const [messages, setMessages] = useState<any[]>([
    { sender: 'John', text: 'Hey there!' },
    { sender: 'You', text: 'Hello!' },
    { sender: 'John', text: 'How are you?' },
  ]);
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { sender: 'You', text: message }]);
      setMessage('');
    }
  };

  return (
    <main className="p-4 relative min-h-screen flex flex-col items-center justify-start">
      {/* Back link for now; figure out how to make a button for later */}
      <div className="absolute top-4 left-4">
        <Link href="/contacts" className="text-blue-500">
          Back to Contacts
        </Link>
      </div>

      {/* Chat and Score; will require connection to backend later */}
      <div className="text-center mb-6 mt-20">
        <h1 className="text-2xl font-bold mb-2">Chat with ...</h1>
        <p className="text-sm text-gray-500">Score: 7.5</p>
      </div>

      {/* Messages */}
      <div className="mb-6 flex flex-col items-center justify-center w-full max-w-md space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`w-full ${msg.sender === 'You' ? 'text-right' : 'text-left'}`}>
            <div className={`${msg.sender === 'You' ? 'bg-blue-500 text-white' : 'bg-gray-200'} inline-block p-2 rounded-lg`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Message box */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
        <input
          type="text"
          placeholder="Type here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleSendMessage}
          className="w-full bg-blue-600 text-white py-2 mt-2 rounded"
        >
          Send
        </button>
      </div>
    </main>
  );
}
