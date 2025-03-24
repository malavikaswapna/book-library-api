import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Books from './Books';
import Login from './Login';
import BookDetails from './BookDetails';
import BookEdit from './BookEdit';
import AdminUsers from './AdminUsers';
import Register from './Register';

function App() {
  const isAuthenticated = !!localStorage.getItem('token'); 

  return (
    <Router>
      <Routes>
        {/* Redirect to login if not authenticated */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/books" /> : <Login />} />

        {/* Protected route, only accessible if authenticated */}
        <Route path="/books" element={isAuthenticated ? <Books /> : <Navigate to="/" />} />
        
        {/* Book details route */}
        <Route path="/book/:id" element={isAuthenticated ? <BookDetails /> : <Navigate to="/" />} />

        <Route path="/book/:id/edit" element={isAuthenticated ? <BookEdit /> : <Navigate to="/" />} />

        <Route path="/admin/users" element={isAuthenticated ? <AdminUsers /> : <Navigate to="/" />} /> 

        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;