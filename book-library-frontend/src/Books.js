import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './BookList.module.css';
import RoleBasedComponent from './RoleBasedComponent';
import { getUserRole } from './userUtils';

function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [etags, setEtags] = useState({})
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

  const [filters, setFilters] = useState({
    author: '',
    genre: '',
    year: '',
    title: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [paginationLinks, setPaginationLinks] = useState({});


  const [refreshCounter, setRefreshCounter] = useState(0);
  const refreshBooks = () => {
    setRefreshCounter(prevCounter => prevCounter + 1);
  };

  const navigate = useNavigate();
  const userRole = getUserRole();

  useEffect(() => {
    const fetchBooks = async () => {
      console.log("Fetching books...");
      setLoading(true);
  
      const token = localStorage.getItem('token');
  
      if (!token) {
        console.warn("No token found in localStorage");
        navigate('/login'); 
        return;
      }

      try {

        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', limit);

        if (filters.author) queryParams.append('author', filters.author);
        if (filters.genre) queryParams.append('genre', filters.genre);
        if (filters.year) queryParams.append('year', filters.year);
        if (filters.title) queryParams.append('title', filters.title);

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        };
        
        const storedEtag = localStorage.getItem(`books_etag_${queryParams.toString()}`);
        if (storedEtag) {
          headers['If-None-Match'] = storedEtag;
          console.log(`Using stored ETag: ${storedEtag}`);
        }

        const response = await axios.get(
          `https://harlembazaar-londonfiber-1025.codio-box.uk/books?${queryParams.toString()}`,
          { headers }
        );

      if (response.status === 200) {
        console.log("Response received:", response.data);
        setBooks(response.data.books || []);
        setTotalPages(response.data.total_pages || 1);
        setTotalItems(response.data.total_items || 0);
        setPaginationLinks(response.data._links || {});

        const etag = response.headers.etag;
        if (etag) {
          console.log(`Storing ETag: ${etag}`);
          localStorage.setItem(`books_etag_${queryParams.toString()}`, etag);
        }
      } else if (response.status === 304) {
        console.log("304 Not Modified - Using cached data");

        const cachedBooksData = JSON.parse(localStorage.getItem(`books_data_${queryParams.toString()}`) || '[]');
        if (cachedBooksData.length > 0) {
          setBooks(cachedBooksData);
        }
      }
    } catch (error) {
      console.error("Error fetching books:", error);

      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (filters.author) queryParams.append('author', filters.author);
      if (filters.genre) queryParams.append('genre', filters.genre);
      if (filters.year) queryParams.append('year', filters.year);
      if (filters.title) queryParams.append('title', filters.title);

      if (error.response && error.response.status === 304) {
        console.log("304 Not Modified - Using cached data");

        const cachedBooksData = JSON.parse(localStorage.getItem(`books_data_${queryParams.toString()}`) || '[]');
        if (cachedBooksData.length > 0) {
          setBooks(cachedBooksData);
        }
      }else if (error.response && error.response.status === 401) {
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
  }, [navigate, refreshCounter, page, limit, filters]);

  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem(`books_data_${page}_${limit}`, JSON.stringify(books));
    }
  }, [books, page, limit]);

  useEffect(() => {
    const shouldRefresh = localStorage.getItem('refreshBooks') === 'true';
    if (shouldRefresh) {
      localStorage.removeItem('refreshBooks');
      refreshBooks();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.refreshBooksList = refreshBooks;

    return () => {
      delete window.refreshBooksList;
    };
  }, []);


  const navigateToBook = (book) => {
    if (book._links && book._links.self && book._links.self.href) {
      const path = book._links.self.href;
      navigate(path);
    } else {
      navigate(`/book/${book.id}`);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
          book_picture: '',
          book_description: '',
          genre: '',
          average_rating: 0
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
    console.log("Delete button clicked for book ID:", bookId);

    if (!window.confirm("Are you sure you want to delete this book?")) {
      console.log("User cancelled deletion");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log("No token found, redirecting to login");
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

      const response = await axios.get('https://harlembazaar-londonfiber-1025.codio-box.uk/books', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setBooks(response.data.books || []);
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

  const renderPaginationControls = () => {
    return (
      <div className={styles.pagination}>
        <button 
          onClick={() => setPage(1)} 
          disabled={page === 1}
          className={styles.paginationButton}
        >
          First
        </button>
        <button 
          onClick={() => setPage(page - 1)} 
          disabled={page === 1}
          className={styles.paginationButton}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {page} of {totalPages} ({totalItems} total books)
        </span>
        <button 
          onClick={() => setPage(page + 1)} 
          disabled={page === totalPages}
          className={styles.paginationButton}
        >
          Next
        </button>
        <button 
          onClick={() => setPage(totalPages)} 
          disabled={page === totalPages}
          className={styles.paginationButton}
        >
          Last
        </button>
        <select 
          value={limit} 
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className={styles.limitSelector}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
    );
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
        <div className={styles.navActions}>
        <a  
            href="https://harlembazaar-londonfiber-1025.codio-box.uk/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docsLink}
        >
            API Docs
          </a>  
          <button 
            onClick={handleLogout} 
            className={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>

      <h1 className={styles.pageTitle}>Book Library</h1>

      <div className={styles.filterControls}>
        <button 
        className={styles.filterButton}
        onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          {showFilters && (
          <div className={styles.filterForm}>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={filters.title}
                  onChange={handleFilterChange}
                  placeholder="Filter by title..."
                />
              </div>

              <div className={styles.filterField}>
                <label>Author:</label>
                <input
                  type="text"
                  name="author"
                  value={filters.author}
                  onChange={handleFilterChange}
                  placeholder="Filter by author..."
                />
              </div>
            </div>
            
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>Genre:</label>
                <input
                  type="text"
                  name="genre"
                  value={filters.genre}
                  onChange={handleFilterChange}
                  placeholder="Filter by genre..."
                />
              </div>
              
              <div className={styles.filterField}>
                <label>Year:</label>
                <input
                  type="number"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  placeholder="Filter by year..."
                />
              </div>
            </div>
            
            <div className={styles.filterActions}>
              <button
                className={styles.applyFiltersButton}
                onClick={() => {
                  setPage(1);
                  refreshBooks();
                }}
              >
                Apply Filters
              </button>
              
              <button
                className={styles.clearFiltersButton}
                onClick={() => {
                  setFilters({
                    author: '',
                    genre: '',
                    year: '',
                    title: ''
                  });
                  setPage(1);
                  refreshBooks();
                }}
              >
                Clear Filters  
              </button>
            </div>
          </div>
        )}
      </div>
      
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
              <h2>Add New Book</h2>
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
        <p className={styles.loading}>Loading books...</p>
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
      {!loading && books.length > 0 && renderPaginationControls()}
    </div>
  );
}

export default Books;