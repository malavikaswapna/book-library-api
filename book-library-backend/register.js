const Router = require('koa-router');
const bcrypt = require('bcrypt');
const db = require('./db'); // Your database connection file
const saltRounds = 10;

const registerRouter = new Router();

// Register route for creating a new user
registerRouter.post('/register', async (ctx) => {
  const { username, password } = ctx.request.body;

  // Check if username and password are provided
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { message: 'Username and password are required' };
    return;
  }

  try {
    // Check if the username already exists in the database
    const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (existingUser.length > 0) {
      ctx.status = 400;
      ctx.body = { message: 'Username already exists' };
      return;
    }

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    const [result] = await db.query(query, [username, hashedPassword]);

    // Optionally log the result of the insertion for debugging
    console.log('New user inserted:', result);

    ctx.status = 201; // Status 201 means created
    ctx.body = { message: 'User registered successfully' };
  } catch (error) {
    console.error('Registration error:', error);
    ctx.status = 500;
    ctx.body = { message: 'An error occurred while registering the user' };
  }
});

module.exports = registerRouter;
