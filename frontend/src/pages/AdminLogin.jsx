import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      if (response.data.success) {
        // Store token for the admin dashboard
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('token', response.data.token);
        
        
        // Open admin dashboard in new tab
        const adminWindow = window.open('http://localhost:3001', '_blank');
        
        if (adminWindow) {
          setSuccess('Login successful! Admin dashboard opened in new tab.');
          // Redirect back to home after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          // Popup blocked
          setSuccess('Login successful! Click the button below to open admin dashboard:');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const openAdminDashboard = () => {
    window.open('http://localhost:3001', '_blank');
  };

  return (
    <div className="admin-login-page">
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>
      
      <motion.div 
        className="login-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-card">
          <div className="login-header">
            <h1>Admin Portal</h1>
            <p>Sign in to manage your portfolio content</p>
          </div>
          
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17L4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Logging in...
                </>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>
          
          {success && success.includes('Click the button below') && (
            <button 
              onClick={openAdminDashboard}
              className="open-dashboard-btn"
            >
              Open Admin Dashboard
            </button>
          )}
          
          <div className="login-footer">
            <button 
              onClick={() => navigate('/')} 
              className="back-home-btn"
            >
              ← Back to Portfolio
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;