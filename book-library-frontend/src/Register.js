import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css'; // Reuse the login styles

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(
        'https://harlembazaar-londonfiber-1025.codio-box.uk/register',
        { username, password }
      );

      if (response.status === 201) {
        // Registration successful, redirect to login
        navigate('/', { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create an Account</h2>

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
          
          <input 
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={styles.inputField}
          />

          <button 
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className={styles.linkText}>
          Already have an account? <Link to="/" className={styles.link}>Log in</Link>
        </p>

        <footer>
          <p>Made with 💖 by a Book Lover</p>
        </footer>
      </div>
    </div>
  );
}

export default Register;