import { pgTable, text, serial, boolean } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { sql } from 'drizzle-orm';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  inviteLink: text('invite_link').notNull(),
  isActive: boolean('is_active').notNull(),
});

export default async function up() {
  await db.execute(sql`
    CREATE TABLE groups (
      id SERIAL PRIMARY KEY,
      invite_link TEXT NOT NULL,
      is_active BOOLEAN NOT NULL
    );
  `);
}
