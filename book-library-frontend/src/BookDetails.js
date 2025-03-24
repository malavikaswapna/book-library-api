import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import styles from "./BookDetails.module.css";
import RoleBasedComponent from './RoleBasedComponent';

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newReview, setNewReview] = useState({ review_text: '', rating: 5 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookData = async () => {
      const token = localStorage.getItem('token');
    
      if (!token) {
        navigate('/'); 
        return;
      }
    
      setLoading(true);
      setError('');
    
      try {
        // Fetch book details
        const bookResponse = await axios.get(`https://harlembazaar-londonfiber-1025.codio-box.uk/book/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setBook(bookResponse.data);
    
        // Now fetch reviews in a separate try-catch block
        try {
          let reviewsUrl = `/book/${id}/reviews`;
          if (bookResponse.data._links && bookResponse.data._links.reviews) {
            reviewsUrl = bookResponse.data._links.reviews.href;
          }
    
          const reviewResponse = await axios.get(`https://harlembazaar-londonfiber-1025.codio-box.uk${reviewsUrl}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
    
          setReviews(reviewResponse.data.reviews || []);
        } catch (reviewError) {
          console.error('Error fetching reviews:', reviewError);
          // If reviews can't be fetched for any reason, just set an empty array
          setReviews([]);
          // Don't navigate away or show an error - still show the book details
        }
      } catch (bookError) {
        console.error('Error fetching book data:', bookError);
    
        if (bookError.response && bookError.response.status === 401) {
          localStorage.removeItem('token');
          setError('Your session has expired. Please log in again.');
          navigate('/');
        } else {
          setError('Failed to fetch book data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookData();
  }, [id, navigate]);
  
  const navigateToCollection = () => {
    if (book && book._links && book._links.collection) {
      navigate(book._links.collection.href);
    } else {
      navigate('/books');
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview({
      ...newReview,
      [name]: name === 'rating' ? parseInt(value, 10) : value
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await axios.post(
        `https://harlembazaar-londonfiber-1025.codio-box.uk/book/${id}/reviews`,
        newReview,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        const reviewResponse = await axios.get(
          `https://harlembazaar-londonfiber-1025.codio-box.uk/book/${id}/reviews`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        setReviews(reviewResponse.data.reviews || []);
        setNewReview({ review_text: '', rating: 5 });
      }
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to add review.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      await axios.delete(
        `https://harlembazaar-londonfiber-1025.codio-box.uk/review/${reviewId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
      if (error.response && error.response.status === 403) {
        alert("You don't have permission to delete reviews.");
      } else {
        alert("Failed to delete reviews.");
      }
    }
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <p>Loading book details...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : book ? (
        <>
         <button 
            onClick={navigateToCollection} 
            className={styles.backButton}
          >
            Back to Books
          </button>

          <h2 className={styles.bookTitle}>{book.title}</h2>
          <p className={styles.bookDetails}><strong>Author:</strong> {book.author}</p>
          <p className={styles.bookDetails}><strong>Published Year:</strong> {book.published_year}</p>

          {/* Book Image */}
          {book.book_picture && (
            <img
              src={book.book_picture}
              alt={book.title}
              className={styles.bookImage}
            />
          )}

          <p className={styles.description}><strong>Description:</strong> {book.book_description}</p>
          <p className={styles.rating}><strong>Rating:</strong> {book.average_rating} ⭐</p>
          <p className={styles.genre}>{book.genre}</p>

          {/* Reviews Section */}
          <div className={styles.reviews}>
            <h3>Reviews</h3>

            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
              <div className={styles.formGroup}>
                <label htmlFor="review_text">Your Review:</label>
                <textarea
                  id="review_text"
                  name="review_text"
                  value={newReview.review_text}
                  onChange={handleReviewChange}
                  required
                  rows="4"
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="rating">Rating:</label>
                <select
                  id="rating"
                  name="rating"
                  value={newReview.rating}
                  onChange={handleReviewChange}
                  required
                >
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
              <button type="submit" className={styles.submitButton}>Add Review</button>
            </form>

            {reviews.length > 0 ? (
              <ul className={styles.reviewList}>
                {reviews.map((review) => (
                  <li key={review.id} className={styles.reviewItem}>
                    <div className={styles.reviewContent}>
                      <p className={styles.reviewText}>{review.review_text}</p>
                      <p className={styles.reviewRating}><strong>Rating:</strong> {review.rating} ⭐</p>
                      <p className={styles.reviewDate}>
                        <small>Posted on: {new Date(review.created_at).toLocaleDateString()}</small>
                      </p>
                    </div>

                    <RoleBasedComponent requiredRole="editor">
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className={styles.deleteReviewButton}
                      >
                        Delete
                      </button>
                    </RoleBasedComponent>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No reviews available.</p>
            )}
          </div>
        </>
      ) : (
        <p>No book found.</p>
      )}
    </div>
  );
}

export default BookDetails;