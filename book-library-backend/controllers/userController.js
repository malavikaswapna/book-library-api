const db = require('../db');
const auth = require('basic-auth'); // ✅ Handle Basic Authentication headers
require('dotenv').config(); // ✅ Load environment variables

// ✅ Register a new user (No password required)
exports.registerUser = async (ctx) => {
  const { username } = ctx.request.body;

  if (!username) {
    ctx.status = 400;
    ctx.body = { message: "Username is required" };
    return;
  }

  try {
    // Insert user without a password
    await db.query("INSERT INTO users (username) VALUES (?)", [username]);
    ctx.status = 201;
    ctx.body = { message: "User registered successfully" };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: error.message };
  }
};

// ✅ Login user with Basic Authentication (No password required)
exports.loginUser = async (ctx) => {
  const credentials = auth(ctx.req);  // Extract Basic Auth credentials from header

  if (!credentials || !credentials.name) {
    ctx.status = 400;
    ctx.body = { message: "Username is required" };
    return;
  }

  const { name: username } = credentials;

  try {
    const [user] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (!user || user.length === 0) {
      ctx.status = 401;
      ctx.body = { message: "Invalid username" };
      return;
    }

    // ✅ Successful login (no password check)
    ctx.status = 200;
    ctx.body = { message: "Login successful" };

  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: error.message };
  }
};
