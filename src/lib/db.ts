import knex, { Knex } from "knex";

const db: Knex = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "wthkpi",
  },
  pool: { min: 1, max: 10 },
});

export default db;
