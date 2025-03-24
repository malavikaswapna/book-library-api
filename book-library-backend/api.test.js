const request = require("supertest");
const bcrypt = require("bcrypt");
const server = require("./index");  // Ensure you export `server` from index.js
const db = require("./db");  // Ensure this is correctly pointing to your DB module

let authHeader; // Store the Basic Auth header

// Before all tests, create a test user with a hashed password
beforeAll(async () => {
  const username = "testuser";
  const plainPassword = "mypassword";  // This is the real password
  const hashedPassword = await bcrypt.hash(plainPassword, 10);  // Hash the password

  // Insert user with hashed password (ignore duplicate errors)
  await db.query(
    "INSERT INTO users (username, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE password = ?",
    [username, hashedPassword, hashedPassword]
  );

  // Encode `username:password` in Base64 for Basic Auth
  const base64Auth = Buffer.from(`${username}:${plainPassword}`).toString("base64");
  authHeader = `Basic ${base64Auth}`;
});

// Test login to verify authentication works
it("should return success message when login is successful with Basic Auth", async () => {
  const response = await request(server)
    .post("/login")
    .set("Authorization", authHeader);  // Pass Basic Auth header

  expect(response.status).toBe(200);
  expect(response.body.message).toBe("Login successful");
});

describe("GET /books", () => {
  it("should return a list of books with valid Basic Authentication", async () => {
    const response = await request(server)
      .get("/books")
      .set("Authorization", authHeader);  // Pass Basic Auth header

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("should return 401 when no authentication is provided", async () => {
    const response = await request(server).get("/books");  // No Auth header

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authorization header missing");
  });
});

describe("GET /book/:id", () => {
  it("should return book details for valid book ID with Basic Authentication", async () => {
    const response = await request(server)
      .get("/book/1")
      .set("Authorization", authHeader);  // Pass Basic Auth header

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
  });

  it("should return 404 for non-existent book with Basic Authentication", async () => {
    const response = await request(server)
      .get("/book/999")
      .set("Authorization", authHeader);  // Pass Basic Auth header

    expect(response.status).toBe(404);
  });

  it("should return 401 for invalid credentials", async () => {
    const fakeAuthHeader = `Basic ${Buffer.from("wronguser:wrongpassword").toString("base64")}`;

    const response = await request(server)
      .get("/books")
      .set("Authorization", fakeAuthHeader);  // Use incorrect credentials

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid username or password");
  });
});

// After all tests, close the server and DB connections properly
afterAll(async () => {
  await server.close();  
  await db.end();  
});
