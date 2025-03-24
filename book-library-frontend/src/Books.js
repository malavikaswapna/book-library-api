import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './BookList.module.css';
import RoleBasedComponent from './RoleBasedComponent';
import { getUserRole } from './userUtils';

function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    published_year: '',
    book_picture: '',
    book_description: '',
    genre: '',
    average_rating: 0
  });
  const navigate = useNavigate();
  const userRole = getUserRole();

  useEffect(() => {
    const fetchBooks = async () => {
      console.log("Fetching books...");

      const token = localStorage.getItem('token');

      if (!token) {
        console.warn("No token found in localStorage");
        navigate('/login'); 
        return;
      }

      try {
        const response = await axios.get('https://harlembazaar-londonfiber-1025.codio-box.uk/books', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log("Response received:", response.data);
        setBooks(response.data.books || []);
      } catch (error) {
        console.error("Error fetching books:", error);

        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          alert("Your session has expired. Please login again.");
          navigate('/');
        } else {
        alert("Failed to fetch books.");
        }
      } finally {
        setLoading(false); 
      }
    };

    fetchBooks();
  }, [navigate]);

  const navigateToBook = (book) => {
    if (book._links && book._links.self && book._links.self.href) {
      const path = book._links.self.href;
      navigate(path);
    } else {
      navigate(`/book/${book.id}`);
    }
  };

  // Add logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');

    window.location.href = '/';
  };

  const handleAddBook = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await axios.post(
        'https://harlembazaar-londonfiber-1025.codio-box.uk/books',
        newBook,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        const updatedBooksResponse = await axios.get(
          'https://harlembazaar-londonfiber-1025.codio-box.uk/books',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        setBooks(updatedBooksResponse.data.books || []);
        setShowAddForm(false);
        setNewBook({
          title: '',
          author: '',
          published_year: '',
          book_description: '',
          genre: ''
        });
      }
    } catch (error) {
      console.error("Error adding books:", error);
      if (error.response) {
        if (error.response.status === 401) {
          alert("Your session has expired. Please log in again.");
          navigate('/');
        } else if (error.response.status === 403) {
          alert("You don't have permission to add books.");
        } else {
          alert("Failed to add book.");
        }
      } else {
        alert("Network error. Please try again.");
      }
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      await axios.delete(
        `https://harlembazaar-londonfiber-1025.codio-box.uk/book/${bookId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setBooks(books.filter(book => book.id !== bookId));
    } catch (error) {
      console.error("Error deleting book:", error);
      if (error.response && error.response.status === 403) {
        alert("You don't have permission to delete books.");
      } else {
        alert("Failed to delete book.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook({
      ...newBook,
      [name]: value
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.userBar}>
        <div className={styles.welcomeMessage}>
          Welcome, {localStorage.getItem('username') || 'Guest'}
          {userRole !== 'user' && (
            <span className={styles.roleTag}>
              {userRole === 'admin' ? ' (Admin)' : ' (Editor)'}
            </span>
          )}
        </div>
        <button 
          onClick={handleLogout} 
          className={styles.logoutButton}
        >
          Logout
        </button>
      </div>

      <h1 className={styles.pageTitle}>Book Library</h1>

      <RoleBasedComponent requiredRole="admin">
        <div className={styles.adminPanel}>
          <h2>Admin Panel</h2>
          <button
            className={styles.adminButton}
            onClick={() => navigate('/admin/users')}
          >
            Manage Users
          </button>
        </div>
      </RoleBasedComponent>

      <RoleBasedComponent requiredRole="editor">
        <div className={styles.editorControls}>
          {!showAddForm ? (
            <button
              className={styles.addBookButton}
              onClick={() => setShowAddForm(true)}
            >
              Add New Book
            </button>
          ) : (
            <div className={styles.addBookForm}>
              <h2> Add New Book</h2>
              <form onSubmit={handleAddBook}>
                <div className={styles.formGroup}>
                  <label>Title:</label>
                  <input
                    type="text"
                    name="title"
                    value={newBook.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Author:</label>
                  <input
                    type="text"
                    name="author"
                    value={newBook.author}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Published Year:</label>
                  <input
                    type="number"
                    name="published_year"
                    value={newBook.published_year}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Book Cover URL:</label>
                  <input
                    type="url"
                    name="book_picture"
                    value={newBook.book_picture || ''}
                    onChange={handleInputChange}
                    placeholder="https://i.imgur.com/1yjr3zv.jpeg"
                  />
                  <small className={styles.formHelp}>Enter a URL for the book cover Image</small>
                </div>
                <div className={styles.formGroup}>
                  <label>Description:</label>
                  <textarea
                    name="book_description"
                    value={newBook.book_description}
                    onChange={handleInputChange}
                    rows="4"
                  ></textarea>
                </div>
                <div className={styles.formGroup}>
                  <label>Genre:</label>
                  <input
                    type="text"
                    name="genre"
                    value={newBook.genre}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Average Rating:</label>
                  <input
                    type="number"
                    name="average_rating"
                    min="0"
                    max="5"
                    step="0.1"
                    value={newBook.average_rating || 0}
                    onChange={handleInputChange}
                    placeholder="Initial rating (0-5)"
                  />
                  <small className={styles.formHelp}>Enter an initial rating from 0 to 5</small>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitButton}>Add Book</button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </RoleBasedComponent>

      {loading ? (
        <p className={styles.loading}>Loading books...</p>  // Loading message
      ) : books.length > 0 ? (
        <div className={styles.booksGrid}>
          {books.map((book) => (
            <div
              key={book.id}
              className={styles.bookCard} 
            >
              <div
              className={styles.bookInfo}
              onClick={() => navigateToBook(book)}
              >
          
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <p className={styles.bookAuthor}>by {book.author}</p>
              <p className={styles.bookYear}>Published: {book.published_year}</p>

              {/* Display average rating */}
              {book.average_rating && (
                <p className={styles.bookRating}>Rating: {book.average_rating} ⭐</p>
              )}

              {/* Display genre */}
              {book.genre && (
                <p className={styles.bookGenre}>Genre: {book.genre}</p>
              )}
            </div>

            <RoleBasedComponent requiredRole="editor">
                <div className={styles.bookActions}>
                  <button 
                    className={styles.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/book/${book.id}/edit`);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBook(book.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </RoleBasedComponent>
            </div>
          ))}
        </div>
      ) : (
        <p>No books available.</p>
      )}
    </div>
  );
}

export default Books;








