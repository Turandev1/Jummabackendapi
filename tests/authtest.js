// File: backend/tests/auth.test.js
const request = require("supertest");
const app = require("../index");

describe("Authentication", () => {
  test("POST /api/auth/login with valid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Test123!",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
  });

  test("POST /api/auth/login with invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(400);
  });
});
