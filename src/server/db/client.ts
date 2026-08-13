import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) throw new Error("MONGODB_URI is not set");
if (!dbName) throw new Error("MONGODB_DB is not set");

declare global {
  var __mongoClient: MongoClient | undefined;
}

export const client =
  globalThis.__mongoClient ?? new MongoClient(uri, { ignoreUndefined: true });

if (process.env.NODE_ENV !== "production") globalThis.__mongoClient = client;

export const db = client.db(dbName);
