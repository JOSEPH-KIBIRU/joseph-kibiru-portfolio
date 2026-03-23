import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import ProjectManager from './components/ProjectManager';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for token in localStorage (from main portfolio login)
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      
      if (token) {
        try {
          // Verify token with backend
          const response = await axios.get('http://localhost:5000/api/verify-token', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.valid) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-app">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ProjectManager onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;