import mongoose, { Connection } from "mongoose";

/**
 * Global type declaration for caching the mongoose connection
 * This prevents TypeScript errors when accessing global.mongoose
 */
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

/**
 * MongoDB connection URI from environment variables
 */
const MONGODB_URI: string = (() => {
  const uri = process.env.MONGODB_URI;

  // Validate that the MongoDB URI is defined
  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  return uri;
})();

/**
 * Initialize the cached connection object
 * In development, Next.js hot reloading can cause multiple connections
 * Caching prevents connection exhaustion and improves performance
 */
let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Establishes and maintains a MongoDB connection using Mongoose
 *
 * Features:
 * - Connection caching to prevent multiple connections
 * - Optimized connection options for production
 * - Proper error handling and validation
 *
 * @returns {Promise<Connection>} The active Mongoose connection
 *
 * @example
 * ```typescript
 * import connectDB from '@/lib/mongodb';
 *
 * async function handler() {
 *   await connectDB();
 *   // Your database operations here
 * }
 * ```
 */
async function connectDB(): Promise<Connection> {
  /**
   * Return existing connection if already established
   * This prevents creating multiple connections on subsequent calls
   */
  if (cached.conn) {
    return cached.conn;
  }

  /**
   * If no connection exists but a promise is in progress,
   * wait for that promise to resolve instead of creating a new one
   */
  if (!cached.promise) {
    const options = {
      /**
       * Buffer commands when connection is lost (default: true)
       * Commands will be buffered until connection is re-established
       */
      bufferCommands: false,
    };

    /**
     * Create a new connection promise
     * mongoose.connect() returns a Mongoose instance, not a Connection
     * We access the connection via .connection property
     */
    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        return mongooseInstance.connection;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        // Reset the promise so the next call will retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    /**
     * Wait for the connection promise to resolve
     * and cache the connection for future use
     */
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise on error to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
