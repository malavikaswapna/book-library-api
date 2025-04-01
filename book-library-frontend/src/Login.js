import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css'; 
import { Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if the user is already logged in by looking at localStorage
  const token = localStorage.getItem('token');

  // If user is already logged in, redirect to /books immediately
  if (token) {
    navigate('/books');
    return null;  // Prevent rendering the form if the user is logged in
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form reload

    setIsLoading(true);
    setErrorMessage(''); // Clear previous error

    try {
      // Base64 encode the username and password
      const credentials = btoa(`${username}:${password}`);

      // Send username and password in the request body
      const response = await axios.post('https://harlembazaar-londonfiber-1025.codio-box.uk/login', {}, { 
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.data.token) {
        // Save username and password in localStorage only once
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.user?.username || 'testuser');

        localStorage.removeItem('password');

        navigate('/books');
        window.location.href = '/books';
      } else {
        setErrorMessage('Invalid credentials');
      }
    } catch (error) {
      setErrorMessage('Invalid username or password');
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);  // Stop loading
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome to the Book Library!</h2>

        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

        <form onSubmit={handleSubmit}>
          <input 
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={styles.inputField}
          />

          <input 
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.inputField}
          />

          <button 
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className={styles.linkText}>
          Don't have an account? <Link to="/register" className={styles.link}>Register</Link>
        </p>

        <footer>
          <p>Made with 💖 by a Book Lover</p>
        </footer>
      </div>
    </div>
  );
}

export default Login;




