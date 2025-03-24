const bcrypt = require('bcrypt');
const db = require('./db'); // Import database connection

// Authenticate User (Check Username and Password)
async function authenticateUser (username, password) {
  try {
    console.log(`Authenticating user: ${username}`); // Debug log

    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (!users.length) {
      console.log('User not found in the database'); // Debug log
      return null;
    }

    const user = users[0];

    console.log(`Stored hashed password: ${user.password}`); // Debug log
    console.log(`Entered password: ${password}`); // Debug log

    // Compare input password with stored hashed password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      console.log('Password does not match');
      return null;
    }

    console.log('Authentication successful!'); // Debug log
    return user; // Return user if authentication is successful
  } catch (error) {
    console.error('Error during authentication:', error);
    return null;
  }
};

module.exports = { authenticateUser };