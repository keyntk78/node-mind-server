import 'dotenv/config';

/**
 * This file collects the configuration variables from the environment.
 *
 * It provides a centralized location for accessing environment variables with default values and validation.
 * Better yet, feel free to change the config later.
 */

// Basic application configuration.
export const APP_NAME = process.env.APP_NAME || 'node-mind-server';
export const APP_PORT = parseInt(process.env.APP_PORT || '3001', 10);
export const APP_HOST = process.env.APP_HOST || '0.0.0.0';
export const NODE_ENV = process.env.NODE_ENV || 'development';

// // Database Constants
// export const DB_PROVIDER = 'DbConnectionToken';
// export const SERVICE = 'DB_POSTGRES_SERVICE';
// export const DATABASE_SERVICE =
//   process.env.DATABASE_SERVICE || 'DATABASE_SERVICE';

// PostgreSQL Constants
export const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/node_mind';
// export const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10);

// Redis Constants
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
export const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);

// Mail Constants
export const MAIL_HOST = process.env.MAIL_HOST || 'localhost';
export const MAIL_PORT = parseInt(process.env.MAIL_PORT || '1025', 10);
export const MAIL_USER = process.env.MAIL_USER || undefined;
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD || undefined;
export const MAIL_FROM =
  process.env.MAIL_FROM || '"Node Mind" <noreply@node-mind.local>';

// // JWT Constants
// export const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';
// export const JWT_REFRESH_SECRET =
//   process.env.JWT_REFRESH_SECRET || 'your-default-refresh-secret';
// export const JWT_EXPIRATION_TIME = (process.env.JWT_EXPIRATION_TIME ??
//   '3600s') as StringValue;
// export const JWT_REFRESH_EXPIRATION_TIME = (process.env
//   .JWT_REFRESH_EXPIRATION_TIME ?? '7d') as StringValue;

// // Google OAuth Constants (Web)
// export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

// // Mobile Google OAuth Constants (Platform-specific)
// export const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID;
// export const GOOGLE_ANDROID_CLIENT_ID = process.env.GOOGLE_ANDROID_CLIENT_ID;
// export const GOOGLE_MOBILE_CALLBACK_IOS_URL =
//   process.env.GOOGLE_MOBILE_CALLBACK_IOS_URL;
// export const GOOGLE_MOBILE_CALLBACK_ANDROID_URL =
//   process.env.GOOGLE_MOBILE_CALLBACK_ANDROID_URL;

// // Apple OAuth Constants
// export const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
// export const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
// export const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
// export const APPLE_IOS_CLIENT_ID = process.env.APPLE_IOS_CLIENT_ID;
// export const APPLE_ANDROID_CLIENT_ID = process.env.APPLE_ANDROID_CLIENT_ID;
// // Optional additional audiences (comma-separated) to accept for aud validation
// export const APPLE_IOS_ADDITIONAL_AUDIENCES =
//   process.env.APPLE_IOS_ADDITIONAL_AUDIENCES;
// export const APPLE_ANDROID_ADDITIONAL_AUDIENCES =
//   process.env.APPLE_ANDROID_ADDITIONAL_AUDIENCES;

// // Email encryption secrets are required; missing values fail fast during startup.
// if (!process.env.EMAIL_ENCRYPTION_KEY) {
//   throw new Error(
//     'FATAL ERROR: EMAIL_ENCRYPTION_KEY is not defined in environment variables.',
//   );
// }
// if (!process.env.EMAIL_BLIND_INDEX_SECRET) {
//   throw new Error(
//     'FATAL ERROR: EMAIL_BLIND_INDEX_SECRET is not defined in environment variables.',
//   );
// }

// // Export secrets only after validation so other modules can use them directly.
// export const EMAIL_ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;
// export const EMAIL_BLIND_INDEX_SECRET = process.env.EMAIL_BLIND_INDEX_SECRET;

// // Grafana Constants
// export const GRAFANA_USER = process.env.GRAFANA_USER || 'admin';
// export const GRAFANA_PASSWORD = process.env.GRAFANA_PASSWORD || 'admin';

// // Prometheus Constants
// export const PROMETHEUS_PORT = parseInt(
//   process.env.PROMETHEUS_PORT || '9090',
//   10,
// );
// export const GRAFANA_PORT = parseInt(process.env.GRAFANA_PORT || '3000', 10);
