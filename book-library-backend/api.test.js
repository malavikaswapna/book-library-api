const request = require("supertest");
const bcrypt = require("bcrypt");
const server = require("./index");
const db = require("./db");
const jwt = require("./jwt");

//Test users
const TEST_USERS = {
  admin: { username: "admin", password: "adminpassword", role: "admin" },
  editor: { username: "editor", password: "editorpassword", role: "editor" },
  user: { username: "newuser", password: "newpassword", role: "user" },
};

let tokens = {
  admin: null,
  editor: null,
  user: null,
};

const authRequest = (role) => {
    return {
      get: (url) => request(server).get(url).set("Authorization", `Bearer ${tokens[role]}`),
      post: (url, data) => request(server).post(url).set("Authorization", `Bearer ${tokens[role]}`).send(data),
      put: (url, data) => request(server).put(url).set("Authorization", `Bearer ${tokens[role]}`).send(data),
      delete: (url) => request(server).delete(url).set("Authorization", `Bearer ${tokens[role]}`),
    };
  };

let testBookId;
let testReviewId;

beforeAll(async () => {

  for (const roleKey in TEST_USERS) {
    const user = TEST_USERS[roleKey];
    const hashedPassword = await bcrypt.hash(user.password, 10);

    try {
      await db.query(
        "INSERT INTO users (username, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE username = username",
        [user.username, hashedPassword]
      );
      
      const [rows] = await db.query("SELECT id FROM users WHERE username = ?", [user.username]);
      
      if (rows.length > 0) {
        const userId = rows[0].id;

        const [roleRows] = await db.query("SELECT id FROM roles WHERE name = ?", [user.role]);
        if (roleRows.length > 0) {
          await db.query("UPDATE users SET role_id = ? WHERE id = ?", [roleRows[0].id, userId]);
        }
      }
    } catch (error) {
      console.error(`Error creating test user ${user.username}:`, error);
    }

    try {

      const response = await request(server)
        .post("/login")
        .set("Authorization", `Basic ${Buffer.from(`${user.username}:${user.password}`).toString("base64")}`);

      if (response.body.token) {
        tokens[roleKey] = response.body.token;
      }
    } catch (error) {
      console.error(`Error getting token for ${user.username}:`, error);
    }
  }
});

//Test authentication
describe("Authentication", () => {
    it("should return 401 when no authentication is provided", async () => {
      const response = await request(server).get("/books");
      expect(response.status).toBe(401);
    });
    
    it("should return 401 with invalid token", async () => {
      const response = await request(server)
        .get("/books")
        .set("Authorization", "Bearer invalidtoken");
      
      expect(response.status).toBe(401);
    });

    it("should login successfully with valid credentials", async () => {
      const user = TEST_USERS.user;
      const response = await request(server)
        .post("/login")
        .set("Authorization", `Basic ${Buffer.from(`${user.username}:${user.password}`).toString("base64")}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });
});

//Test authorization - role based
describe("Role-based Authorization", () => {
  it("should allow admin to access admin resources", async () => {
    const response = await authRequest("admin").get("/admin/users");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("users");
  });

  it("should deny regular user access to admin resources", async () => {
    const response = await authRequest("user").get("/admin/users");
    expect(response.status).toBe(403);
  });

  it("should deny editor access to admin resources", async () => {
    const response = await authRequest("editor").get("/admin/users");
    expect(response.status).toBe(403);
  });

  it("should allow editors to create books", async () => {
    const response = await authRequest("editor").post("/books", {
      title: "Test Book",
      author: "Test Author",
      published_year: 2023,
      book_picture: "https://i.imgur.com/1yjr3zv.jpeg",
      book_description: "A test book",
      average_rating: 4.5,
      genre: "Testing"
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    testBookId = response.body.id;
  });

  it("should deny regular users access to create books", async () => {
    const response = await authRequest("user").post("/books", {
      title: "User Test Book",
      author: "User Author",
      published_year: 2023,
      book_picture: "https://i.imgur.com/1yjr3zv.jpeg",
      book_description: "A user test book",
      average_rating: 4.5,
      genre: "User Testing"
    });

    expect(response.status).toBe(403);
  });
});

//Test HATEOAS links
describe("HATEOAS Implementation", () => {
  it("should include HATEOAS links in book listings", async () => {
    const response = await authRequest("user").get("/books");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("_links");
    expect(response.body).toHaveProperty("books");
    expect(Array.isArray(response.body.books)).toBeTruthy();

    if (response.body.books.length > 0) {
      expect(response.body.books[0]).toHaveProperty("_links");
      expect(response.body.books[0]._links).toHaveProperty("self");
      expect(response.body.books[0]._links).toHaveProperty("reviews");
    }
  });

  it("should include HATEOAS links in book details", async () => {
if (!testBookId) {

  const bookResponse = await authRequest("editor").post("/books", {
    title: "HATEOAS Test Book",
    author: "HATEAOS Author",
    published_year: 2023,
    book_picture: "https://i.imgur.com/1yjr3zv.jpeg",
    book_description: "A HATEOAS test book",
    average_rating: 4.5,
    genre: "HATEOAS Testing"   
  });
  testBookId = bookResponse.body.id;
}

const response = await authRequest("user").get(`/book/${testBookId}`);

expect(response.status).toBe(200);
expect(response.body).toHaveProperty("_links");
expect(response.body._links).toHaveProperty("self");
expect(response.body._links).toHaveProperty("reviews");
expect(response.body._links).toHaveProperty("collection");

});
});

//Test review functionality
describe("Reviews Resource", () => {
  it("should allow users to add reviews", async () => {
    if (!testBookId) {
      const bookResponse = await authRequest("editor").post("/books", {
        title: "Review Test Book",
        author: "Review Author",
        published_year: 2023
      });
      testBookId = bookResponse.body.id;
    }

    const response = await authRequest("user").post(`/book/${testBookId}/reviews`, {
      review_text: "This is a test review",
      rating: 4  
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");

    testReviewId = response.body.id;
  });

  it("should get reviews for a book", async () => {
    const response = await authRequest("user").get(`/book/${testBookId}/reviews`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("reviews");
  });

  it("should allow editors to delete reviews", async () => {
    const reviewResponse = await authRequest("user").post(`/book/${testBookId}/reviews`, {
      review_text: "Review to delete",
      rating: 3  
    });
    
    const reviewId = reviewResponse.body.id;

    const response = await authRequest("editor").delete(`/review/${reviewId}`);
    expect(response.status).toBe(200);
  });

  it("should deny regular users permission to delete reviews", async () => {
    if (testReviewId) {
      const response = await authRequest("user").delete(`/review/${testReviewId}`);
      expect(response.status).toBe(403);  
    }  
  });
});

//Test request validation and edge cases
describe("Input Validation and Edge Cases", () => {
  it("should validate book creation input", async () => {
    const response = await authRequest("editor").post("/books", {
      title: "Incomplete Book"
    });

    expect(response.status).toBe(400);
  });
  
  it("should handle non-existent resources gracefully", async () => {
    const response = await authRequest("user").get("/book/999999");
    expect(response.status).toBe(404);  
  });

  it("should validate review ratings", async () => {
    const response = await authRequest("user").post(`/book/${testBookId}/reviews`, {
      review_text: "Invalid rating review",
      rating: 10  
    });
    
    expect(response.status).toBe(400);
  });
});

//Test caching and conditional requests
describe("Caching and conditional Requests", () => {
  it("should include ETag header in responses", async () => {
    const response = await authRequest("user").get("/books");
    
    expect(response.headers).toHaveProperty("etag");
  });
  
  it("should return 304 Not Modified for conditional request with matching ETag", async () => {
    const firstResponse = await authRequest("user").get("/books");
    const etag = firstResponse.headers.etag;
    
    const conditionalResponse = await authRequest("user")
      .get("/books")
      .set("If-None-Match", etag);

    expect(conditionalResponse.status).toBe(304);
  });
});

afterAll(async () => {
  await db.end();
  
  await server.close();
});

