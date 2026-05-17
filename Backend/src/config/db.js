import mongoose from 'mongoose';
import { env, isProd } from './env.js';

mongoose.set('strictQuery', true);

/**
 * Connects to MongoDB. Bubbles up errors so the caller (server.js) can
 * decide whether to abort the boot — we never want to start the HTTP
 * listener while the DB is down, since every meaningful request would
 * 500 anyway.
 */
export async function connectDB() {
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 12_000,
    autoIndex: !isProd, // build indexes on dev; explicit migrations in prod
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
