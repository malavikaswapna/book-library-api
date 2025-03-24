const Router = require('koa-router');
const bcrypt = require('bcrypt');
const db = require('../db'); 
const auth = require('../auth'); 
const { generateToken } = require('../jwt');

const router = new Router();

// Register a new user
router.post('/register', async (ctx) => {
  try {
    const { username, password, role } = ctx.request.body;

    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { message: 'Username and password are required' };
      return;
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const roleName = role || 'user';
    const [roles] = await db.query('SELECT id FROM roles WHERE name = ?', [roleName]);

    if (!roles.length) {
      ctx.status = 400;
      ctx.body = {message: 'Invalid role specified' };
      return;
    }

    const roleId = roles[0].id;

    // Store user in database
    await db.query('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', [username, hashedPassword, roleId]);
    
    ctx.status = 201;
    ctx.body = { 
      message: 'User registered successfully',
      username,
      role: roleName 
    };
  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = { message: 'Internal Server Error' };
  }
});

// Login user
router.post('/login', async (ctx) => {
  try {
    const authHeader = ctx.headers['authorization'];

    if (!authHeader) {
      ctx.status = 400;
      ctx.body = { message: 'Authorization header missing' };
      return;
    }

    const [authType, credentials] = authHeader.split(' ');

    if (authType !== 'Basic' || !credentials) {
      ctx.status = 400;
      ctx.body = { message: 'Invalid Authorization format' };
      return;
    }

    const decodedCredentials = Buffer.from(credentials, 'base64').toString().split(':');
    const username = decodedCredentials[0];
    const password = decodedCredentials[1];

    if (!username || !password) {
      ctx.status = 400;
      ctx.body = { message: 'Invalid credentials format' };
      return;
    }

    // Authenticate user
    const user = await auth.authenticateUser(username, password);

    if (!user) {
      ctx.status = 401;
      ctx.body = { message: 'Invalid username or password' };
      return;
    }

    const token = await generateToken(user);

    ctx.status = 200;
    ctx.body = {
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        username: user.username
      }
    };
  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = { message: 'Internal Server Error' };
  }
});

module.exports = router;