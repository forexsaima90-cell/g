/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv/config');

const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL || '' }
});
