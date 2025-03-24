import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './BookList.module.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get('https://harlembazaar-londonfiber-1025.codio-box.uk/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,  
          },
        });

        setUsers(response.data.users || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);

        if (error.response) {
          if (error.response.status === 401) {
            localStorage.removeItem('token');
            setError('Your session has expired. Please login again.');
            navigate('/');
          } else if (error.response.status === 403) {
            setError('You do not have permission to access this page.');
          } else {
            setError('Failed to fetch users.');  
          }
        } else {
          setError('Network error. Please try again.');  
        }

        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleRoleChange = async (userId, newRole) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/');
      return;
    }

    try {
      await axios.put(
        `https://harlembazaar-londonfiber-1025.codio-box.uk/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'  
          }  
        }  
      );
      
      setUsers(
        users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user  
        )  
      );

      alert(`Role updated successfully for user ${userId}`);
    } catch (error) {
      console.error('Error updating role:', error);
      
      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please login again.');
        navigate('/');  
      } else {
        alert('Failed to update role.');  
      }
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}?`)) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/');
      return;
    }

    try {
      await axios.delete(
        `https://harlembazaar-londonfiber-1025.codio-box.uk/admin/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setUsers(users.filter(user => user.id !== userId));

      alert(`User ${username} deleted successfully`);
    } catch (error) {
      console.error('Error deleting user:', error);

      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please login again.');
        navigate('/');
      } else {
        alert('Failed to delete user.');
      }
    }
  };

  const handleBack = () => {
    navigate('/books');  
  };

  if (loading) {
    return <p>Loading users...</p>;  
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={handleBack} className={styles.backButton}>
          Back to Books  
        </button> 
      </div> 
    );  
  }

  return (
    <div className={styles.container}>
      <button onClick={handleBack} className={styles.backButton}>
        Back to Books
      </button>

      <h1 className={styles.pageTitle}>User Management</h1>

      {users.length > 0 ? (
        <div className={styles.userTable}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Current Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td className={styles.userActions}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={styles.roleSelect}
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className={styles.deleteUserButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No users found.</p>
      )}  
    </div>  
  );
}

export default AdminUsers;