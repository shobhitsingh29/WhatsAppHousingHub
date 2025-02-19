import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  host: 'ep-silent-band-a8v3nsul-pooler.eastus2.azure.neon.tech',
  port: parseInt('5432', 10),
  user: 'neondb_owner',
  password: 'npg_9ugXciq0edUn',
  database: 'neondb',
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createTables() {
  try {
    await client.connect();
    console.log('Connected to the database');

    const groupsTableQuery = `
      CREATE SCHEMA IF NOT EXISTS public;
      CREATE TABLE IF NOT EXISTS public.groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Executing groups table creation query:', groupsTableQuery);
    await client.query(groupsTableQuery);
    console.log('Groups table creation query executed successfully');

    const listingsTableQuery = `
      CREATE TABLE IF NOT EXISTS public.listings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        location VARCHAR(255) NOT NULL,
        propertyType VARCHAR(50) NOT NULL,
        bedrooms INTEGER NOT NULL,
        bathrooms INTEGER NOT NULL,
        imageUrl TEXT,
        furnished BOOLEAN NOT NULL,
        contactInfo VARCHAR(255) NOT NULL
      );
    `;
    console.log('Executing listings table creation query:', listingsTableQuery);
    await client.query(listingsTableQuery);
    console.log('Listings table creation query executed successfully');

    await client.end();
    console.log('Disconnected from the database');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
}

createTables();
