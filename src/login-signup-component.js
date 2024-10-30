import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignUp.css';
import wallpaper from "C:/Users/prana/OneDrive/Desktop/sports/my-react-app/src/wallpaper2.png";

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // New state for success/error messages
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/player-login' : '/player-signup';
      const payload = isLogin
        ? { email, password }
        : { name, age, gender, contactNumber, email, password };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      if (isLogin) {
        localStorage.setItem('playerId', data.playerId);
        localStorage.setItem('playerName', data.playerName);
        navigate('/dashboard');
      } else {
        setMessage('Account created successfully!');
        setTimeout(() => {
          setIsLogin(true);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setAge('');
    setGender('');
    setContactNumber('');
    setError('');
    setMessage('');
  };

  return (
    <div className="fullscreen-container">
      <div className="login-container">
        <div className="left-panel">
          <h1>{isLogin ? 'Welcome Back, Player!' : 'Join Prishiks Academy!'}</h1>
          <p>Let's get started with your {isLogin ? 'game' : 'journey'}.</p>
          {message && <p className="message">{message}</p>} {/* Display success/error message */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min="1"
                  max="100"
                  disabled={isLoading}
                />
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  disabled={isLoading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Contact Number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength="6"
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={isLoading}>
              {isLoading 
                ? 'Please wait...' 
                : isLogin 
                  ? 'Sign In' 
                  : 'Sign Up'
              }
            </button>
          </form>
          <p 
            onClick={!isLoading ? toggleForm : undefined} 
            className={`toggle-form ${isLoading ? 'disabled' : ''}`}
          >
            {isLogin ? "New player? Sign up" : "Already have an account? Log in"}
          </p>
        </div>
        <div className="right-panel">
          <img src={wallpaper} alt="Sports Academy" className="banner-image" />
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;