import knex, { Knex } from "knex";
import type { Connection } from "mysql2";

const db: Knex = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "wthkpi",
    charset: "utf8mb4",
    socketPath: undefined,
  },
  pool: {
    min: 1,
    max: 10,
    afterCreate: (conn: Connection, done: (err?: Error) => void) => {
      conn.query("SET NAMES utf8mb4", (err: Error | null) => done(err ?? undefined));
    },
  },
});

export default db;
