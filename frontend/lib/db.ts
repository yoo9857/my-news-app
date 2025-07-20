// This is a placeholder for your database connection.
// You should replace this with your actual database connection logic (e.g., PostgreSQL, MySQL, MongoDB).

// For demonstration purposes, we'll mock a pg.Pool-like object.
// In a real application, you would use 'pg' library:
// import { Pool } from 'pg';
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = {
  connect: async () => {
    console.log("Connecting to mock database...");
    // In a real application, this would return a pg.Client from the pool.
    return {
      query: async <T>(sql: string, params?: any[]): Promise<{ rows: T[] }> => {
        console.log(`Executing query: ${sql} with params: ${params}`);
        // For demonstration, we return a mock result.
        if (sql.includes("SELECT * FROM users WHERE email")) {
          if (params && params[0] === "test@example.com") {
            return {
              rows: [{
                id: "123",
                email: "test@example.com",
                password: "$2a$10$abcdefghijklmnopqrstuvwxy.abcdefghijklmnopqrstuvwxy", // Hashed password for 'password'
                nickname: "TestUser"
              }] as T[]
            };
          } else {
            return { rows: [] as T[] };
          }
        } else if (sql.includes("SELECT DISTINCT theme FROM stocks")) {
          return {
            rows: [
              { theme: "Technology" },
              { theme: "Finance" },
              { theme: "Healthcare" }
            ] as T[]
          };
        }
        return { rows: [] as T[] };
      },
      release: () => {
        console.log("Releasing mock database client.");
      },
    };
  },
};