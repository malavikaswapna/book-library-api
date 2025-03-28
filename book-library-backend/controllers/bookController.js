const db = require("../db");

// ✅ Get all books
exports.getBooks = async (ctx) => {
  try {
  const [rows] = await db.query("SELECT * FROM books");
  console.log("Books fetched:", rows);

  const booksWithLinks = rows.map(book => ({
    ...book,
    _links: {
      self: { href: `/book/${book.id}` },
      reviews: { href: `/book/${book.id}/reviews` }
    }
  }));

  ctx.body = {
    books: booksWithLinks,
    _links: {
      self: { href: '/books' }
    }
  };


} catch (error) {
  console.error("Error fetching books:", error);  // Log error if any
  ctx.status = 500;
  ctx.body = { message: "Failed to fetch books" };
}
};

// ✅ Get a single book by ID
exports.getBookById = async (ctx) => {
  const { id } = ctx.params;
  const [rows] = await db.query("SELECT * FROM books WHERE id = ?", [id]);
  
  if (rows.length) {
    ctx.body = {
      id: rows[0].id,
      title: rows[0].title,
      author: rows[0].author,
      published_year: rows[0].published_year,
      book_picture: rows[0].book_picture,
      book_description: rows[0].book_description,
      average_rating: rows[0].average_rating,
      genre: rows[0].genre,
      _links: {
        self: { href: `/book/${rows[0].id}` },
        reviews: { href: `/book/${rows[0].id}/reviews` },
        collection: { href: '/books' }
      }
    };
  } else {
    ctx.status = 404;
    ctx.body = { 
      message: "Book not found",
      _links: {
        collection: { href: '/books' }
      }
    };
  }
};


// ✅ Create a new book
exports.createBook = async (ctx) => {
  const { title, author, published_year, book_picture, book_description, genre, average_rating } = ctx.request.body;

  // Check if all required fields are provided
  if (!title || !author || !published_year) {
    ctx.status = 400;
    ctx.body = { 
      message: "All fields (title, author, published_year) are required",
      _links: {
      collection: { href: '/books' }
    }
  };
  return;
}

  // Set a default value for average_rating if not provided (e.g., 0.0)
  const rating = average_rating || 0.0;

  // Insert the new book into the database
  const [result] = await db.query(
    "INSERT INTO books (title, author, published_year, book_picture, book_description, average_rating, genre) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [title, author, published_year, book_picture, book_description, average_rating, genre]
  );

  // Respond with the new book's data
  ctx.status = 201;
  ctx.body = { 
    id: result.insertId, 
    title, 
    author, 
    published_year, 
    book_picture, 
    book_description, 
    average_rating: rating, 
    genre,
    _links: {
      self: { href: `/book/${result.insertId}` },
      reviews: { href: `/book/${result.insertId}/reviews` },
      collection: { href: '/books' }
    }
  };
};

// ✅ Update a book
exports.updateBook = async (ctx) => {
  const { id } = ctx.params;
  const { title, author, published_year, book_picture, book_description, average_rating, genre } = ctx.request.body;

  if (!title || !author || !published_year) {
    ctx.status = 400;
    ctx.body = { message: "Title, Author, and Published Year are required." };
    return;
  }

  // Update the book with the new fields
  await db.query(
    "UPDATE books SET title=?, author=?, published_year=?, book_picture=?, book_description=?, average_rating=?, genre=? WHERE id=?",
    [title, author, published_year, book_picture, book_description, average_rating, genre, id]
  );
  
  ctx.body = { message: "Book updated successfully" };
};


// ✅ Delete a book (also deletes related reviews)
exports.deleteBook = async (ctx) => {
  const { id } = ctx.params;

  try {
    const result = await db.query("DELETE FROM books WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      ctx.status = 404;
      ctx.body = {
        message: "Book not found",
        _links: {
          collection: { href: '/books' }
        }
      };
      return;
    }
    
    ctx.body = { 
      message: "Book and its reviews deleted successfully",
      _links: {
        collection: { href: '/books' }
      }
    };
  } catch (error) {
    console.error("Error deleting book:", error);
    ctx.status = 500;
    ctx.body = {
      message: "Failed to delete book",
      error: error.message
    };
  }
};

// ✅ Get all reviews for a specific book
exports.getReviewsForBook = async (ctx) => {
  const { bookId } = ctx.params;
  const [reviews] = await db.query("SELECT * FROM reviews WHERE book_id = ?", [bookId]);

  if (reviews.length) {
    const reviewsWithLinks = reviews.map(review => ({
      ...review,
      _links: {
        self: { href: `/review/${review.id}` },
        book: { href: `/book/${bookId}` }
      }
    }));

    ctx.body = {
      reviews: reviewsWithLinks,
      _links: {
        self: { href: `/book/${bookId}/reviews` },
        book: { href: `/book/${bookId}` }
      }
    };
  } else {
    ctx.status = 404;
    ctx.body = { 
      message: "No reviews found for this book",
      _links: {
        book: { href: `/book/${bookId}` }
      }
    };
  }
};

// ✅ Add a new review for a book
exports.addReviewForBook = async (ctx) => {
  const { bookId } = ctx.params;
  const { review_text, rating } = ctx.request.body;

  // Check if review_text and rating are provided
  if (!review_text || !rating || rating < 1 || rating > 5) {
    ctx.status = 400;
    ctx.body = { message: "Review_text is required and rating must be between 1 and 5" };
    return;
  }

  // Check if the book exists
  const [bookExists] = await db.query("SELECT * FROM books WHERE id = ?", [bookId]);
  if (!bookExists.length) {
    ctx.status = 404;
    ctx.body = { message: "Book not found" };
    return;
  }

  // Insert the new review into the 'reviews' table
  const [result] = await db.query(
    "INSERT INTO reviews (book_id, review_text, rating) VALUES (?, ?, ?)",
    [bookId, review_text, rating]
  );

  // Respond with the new review's data
  ctx.status = 201;
  ctx.body = {
    id: result.insertId,
    book_id: bookId,
    review_text,
    rating,
  };
};

// ✅ Update a review
exports.updateReview = async (ctx) => {
  console.log("Received data:", ctx.request.body); // Debugging

  const { reviewId } = ctx.params;
  const { review_text, rating } = ctx.request.body;

  if (!review_text || !rating) {
    ctx.status = 400;
    ctx.body = { message: "Review text and rating are required." };
    return;
  }

  const [result] = await db.query(
    "UPDATE reviews SET review_text = ?, rating = ? WHERE id=?",
    [review_text, rating, reviewId]
  );

  if (result.affectedRows) {
    ctx.body = { message: "Review updated successfully" };
  } else {
    ctx.status = 404;
    ctx.body = { message: "Review not found" };
  }
};

// ✅ Delete a review
exports.deleteReview = async (ctx) => {
  const { reviewId } = ctx.params;
  await db.query("DELETE FROM reviews WHERE id = ?", [reviewId]);
  ctx.body = { message: "Review deleted successfully" };
};
