import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css'; // Reuse the same CSS

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth(); // Use the auth context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Registration failed');
      }

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-form-container">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-page">
        <div className="auth-form-container">
          <h2>You are already registered!</h2>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <button onClick={() => navigate('/')} className="auth-button">Go to Home</button>
          <p className="auth-switch-link">
            Not {user.name}? <Link to="/login">Login with another account</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="auth-button">Register</button>
        </form>
        <p className="auth-switch-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
