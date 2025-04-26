# 📚 Book Library API

A delightful full-stack application for managing your personal book collection with style and security!

![Book Library Banner](https://i.imgur.com/6u8Rj44.jpeg)

## ✨ Features

- **📖 Book Management**: Add, view, edit, and delete books in your collection
- **⭐ Reviews & Ratings**: Share your thoughts and rate your favorite reads
- **🔐 User Authentication**: Secure JWT-based login and registration
- **👑 Role-Based Access Control**: Different permissions for users, editors, and admins
- **🔍 Advanced Filtering**: Find books by author, genre, title, or published year
- **📱 Responsive Design**: Beautiful experience on any device
- **🚀 RESTful API**: Well-structured backend with comprehensive endpoints

## 🏗️ Tech Stack

### Backend
- **Node.js** & **Koa.js**: Fast, lightweight server framework
- **MySQL**: Robust relational database
- **JWT Authentication**: Secure token-based user sessions
- **RBAC**: Role-based authorization system
- **RESTful API**: Following best practices
- **HATEOAS**: Hypermedia as the Engine of Application State

### Frontend
- **React**: Component-based UI library
- **React Router**: Client-side routing
- **Axios**: Promise-based HTTP client
- **CSS Modules**: Scoped styling
- **JWT Decode**: Client-side token handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- MySQL server
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/book-library-api.git
   cd book-library-api
   ```
2. **Set up the backend**
   ```bash
   cd book-library-backend
   npm install

   # Create a .env file with your database configuration
   echo "DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=book_library
   DB_SSL=false
   JWT_SECRET=your_secret_key" > .env

   # Create the database
   mysql -u your_username -p -e "CREATE DATABASE book_library;"

   # Run the server
   npm start
   ```
3. **Set up the frontend**
   ```bash
   cd book-library-frontend
   npm install react-router-dom axios

   # Create a .env file for API URL
   echo "REACT_APP_API_URL=http://localhost:1025" > .env

   # Start the React app
   npm start
   ```
4. **Access the application**
   ```bash
   Frontend: http://localhost:3000
   Backend API: http://localhost:1025
   API Documentation: http://localhost:1025/docs
   ```

## 📸 Screenshots

<table>
  <tr>
    <td><img src="https://i.imgur.com/LPNusd1.png" alt="Login Screen" width="400"/></td>
    <td><img src="https://i.imgur.com/BCuDB1t.jpeg" alt="Register Screen" width="400"/></td>
  </tr>
  <tr>
    <td><img src="https://i.imgur.com/xpxUEDr.png" alt="User Dashboard" width="400"/></td>
    <td><img src="https://i.imgur.com/vbLW0na.png" alt="Editor Dashboard" width="400"/></td>
  </tr>
    <tr>
    <td colspan="2"><img src="https://i.imgur.com/LiHqBRI.png" alt="Book Details" width="800"/></td>
  </tr>
    <tr>
    <td><img src="https://i.imgur.com/176E21C.png" alt="Admin Dashboard" width="400"/></td>
    <td><img src="https://i.imgur.com/RvZw4wF.png" alt="Admin Panel" width="400"/></td>
  </tr>
</table>

## 🔑 API Endpoints

### Authentication
* `POST /register`: Register a new user
* `POST /login`: Authenticate and receive JWT token

### Books
* `GET /books`: List all books (with pagination & filtering)
* `GET /book/:id`: Get a specific book
* `POST /books`: Add a new book (Editor/Admin only)
* `PUT /book/:id`: Update a book (Editor/Admin only)
* `DELETE /book/:id`: Delete a book (Editor/Admin only)

### Reviews
* `GET /book/:bookId/reviews`: Get all reviews for a book
* `POST /book/:bookId/reviews`: Add a review for a book
* `PUT /review/:id`: Update a review
* `DELETE /review/:id`: Delete a review (Editor/Admin only)

### Admin
* `GET /admin/users`: List all users (Admin only)
* `PUT /admin/users/:userId/role`: Change a user's role (Admin only)
* `DELETE /admin/users/:userId`: Delete a user (Admin only)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

* Koa.js - The expressive middleware framework for Node.js
* React - A JavaScript library for building user interfaces
* MySQL - The world's most popular open source database
* JWT - JSON Web Tokens for secure authentication

---

Made with 💖 by a Book Lover
