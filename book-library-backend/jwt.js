const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'd591a5d860d926014b315b70de15f99f287ec3d870d44dbc2c38b0ceb272fb24';

// Generate a token
const generateToken = async (user) => {
  console.log('Generate token for user:', user);

  try {
    const [checkUser] = await db.query('SELECT role_id FROM users WHERE id = ?', [user.id]);
    console.log('User role_id check:', checkUser);

    if (!checkUser.length || checkUser[0].role_id === null) {
      console.log('User has no role_id assigned, assigning default user role');

      const [userRole] = await db.query('SELECT id FROM roles WHERE name = ?', ['user']);

      if (userRole.length) {
        await db.query('UPDATE users SET role_id = ? WHERE id = ?', [userRole[0].id, user.id]);
        console.log('Assigned default user role');
      }
    }
    
  const [userRoles] = await db.query(`
    SELECT r.name
    FROM roles r
    JOIN users u ON r.id = u.role_id
    WHERE u.id = ?
  `, [user.id]);

  console.log('User roles query result:', userRoles);

  const role = userRoles.length ? userRoles[0].name : 'user';
  console.log(`Token will include role ${role}`);

  let scopes = ['books:read', 'reviews:read', 'reviews:write'];
    
  if (role === 'editor' || role === 'admin') {
    scopes = [...scopes, 'books:write', 'reviews:write', 'reviews:delete'];
  }
    
  if (role === 'admin') {
    scopes = [...scopes, 'users:read', 'users:write', 'users:delete'];
  }
    
  console.log(`Token will include scopes: ${scopes.join(', ')}`);

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: role,
      scopes: scopes
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log('Token generated successfully');
  return token;
} catch (error) {
  console.error('Error generating token:', error);
  
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      role: 'user',
      scopes: ['books:read', 'reviews:read']
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
};

// Verify a token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return null;
  }
};

module.exports = { generateToken, verifyToken };