import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './BookDetails.module.css';

function BookEdit() {
  const { id } = useParams ();
  const navigate = useNavigate() ;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [book, setBook] = useState({
    title: '',
    author: '',
    published_year: '',
    book_picture: '',
    book_description: '',
    genre: '',
    average_rating: 0
  });

  useEffect(() => {
    const fetchBook = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/');
        return;
      }
      
      try {
        const response = await axios.get(`https://harlembazaar-londonfiber-1025.codio-box.uk/book/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        setBook({
          title: response.data.title || '',
          author: response.data.author || '',
          published_year: response.data.published_year || '',
          book_picture: response.data.book_picture || '',
          book_description: response.data.book_description || '',
          genre: response.data.genre || '',
          average_rating: response.data.average_rating || 0
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching book:', error);

        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          setError('Your session has expired. Please login again.');
          navigate('/');
        } else {
          setError('Failed to fetch book data.');
        }

        setLoading(false);
      }
    };

    fetchBook();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBook({
      ...book,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      await axios.put (
        `https://harlembazaar-londonfiber-1025.codio-box.uk/book/${id}`,
        book,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-type': 'application/json'
            }
        }
      );

      localStorage.setItem('refreshBooks', 'true');

      if (window.refreshBooksList) window.refreshBooksList();

      navigate(`/book/${id}`);
      window.location.href = '/books';
    } catch (error) {
      console.error('Error updating book:', error);

      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please login again.');
        navigate('/');
      } else if (error.response && error.response.status === 403) {
        alert("You don't have permission to edit books.");
      } else {
        alert('Failed to update book.');
      }
    }
  };

  const handleCancel = () => {
    navigate(`/book/${id}`, { state: { bookUpdated: true } });
  };

  if (loading) {
    return <p>Loading book data...</p>;
  }

  if (error && error.length > 0) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div className={styles.container}>
        <h1>Edit Book</h1>

        <form onSubmit={handleSubmit} className={styles.editForm}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={book.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="author">Author:</label>
          <input
            type="text"
            id="author"
            name="author"
            value={book.author}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="published_year">Published Year:</label>
          <input
            type="number"
            id="published_year"
            name="published_year"
            value={book.published_year}
            onChange={handleInputChange}
            required
          />  
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="book_picture">Book Cover URL</label>
          <input
            type="url"
            id="book_picture"
            name="book_picture"
            value={book.book_picture || ''}
            onChange={handleInputChange}
            paceholder="https://i.imgur.com/1yjr3zv.jpeg"
          />
          <small className={styles.formHelp}>Enter a URL for the book cover Image</small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="genre">Genre:</label>
          <input
            type="text"
            id="genre"
            name="genre"
            value={book.genre}
            onChange={handleInputChange}
          />  
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="book_description">Description:</label>
          <textarea
            id="book_description"
            name="book_description"
            value={book.book_description}
            onChange={handleInputChange}
            rows="6"
          ></textarea>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="average_rating">Average Rating:</label>
          <input
            type="number"
            id="average_rating"
            name="average_rating"
            min="0"
            max="5"
            step="0.1"
            value={book.average_rating || 0}
            onChange={handleInputChange}
            placeholder="Rating (0-5)"
          />
          <small className={styles.formHelp}>Enter a rating from 0 to 5</small>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton}>Save Changes</button>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookEdit;