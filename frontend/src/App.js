
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import ConversationsScreen from './components/ConversationsScreen';
import MessageScreen from './components/MessageScreen';
import AnalysisScreen from './components/AnalysisScreen';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/conversations" /> : <LoginScreen setUser={setUser} />
          }/>
          <Route path="/conversations" element={
            !user ? <Navigate to="/login" /> : <ConversationsScreen user={user} />
          }/>
          <Route path="/messages/:conversationId" element={
            !user ? <Navigate to="/login" /> : <MessageScreen user={user} />
          }/>
          <Route path="/analysis/:conversationId" element={
            !user ? <Navigate to="/login" /> : <AnalysisScreen user={user} />
          }/>
          <Route path="*" element={<Navigate to={user ? "/conversations" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;