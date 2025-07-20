
// This is a placeholder for your database connection.
// You should replace this with your actual database connection logic (e.g., PostgreSQL, MySQL, MongoDB).

export const db = {
  query: async (sql: string, params?: any[]) => {
    console.log(`Executing query: ${sql} with params: ${params}`);
    // In a real application, you would connect to your database here.
    // For demonstration, we return a mock result.
    if (sql.includes("SELECT * FROM users WHERE email")) {
      if (params && params[0] === "test@example.com") {
        return {
          rows: [{
            id: "123",
            email: "test@example.com",
            password: "$2a$10$abcdefghijklmnopqrstuvwxy.abcdefghijklmnopqrstuvwxy", // Hashed password for 'password'
            nickname: "TestUser"
          }]
        };
      } else {
        return { rows: [] };
      }
    }
    return { rows: [] };
  },
};
