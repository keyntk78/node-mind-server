CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
  "mfa_secret_encrypted" TEXT,
  "last_login_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);

CREATE TABLE "social_accounts" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL,
  "provider_external_id" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "social_accounts_provider_external_id_key" UNIQUE ("provider", "provider_external_id"),
  CONSTRAINT "social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "profiles" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "first_name" VARCHAR(100),
  "last_name" VARCHAR(100),
  "avatar_url" TEXT,
  "phone_number" VARCHAR(20),
  "bio" TEXT,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_users_email" ON "users"("email") WHERE "is_active" = true;
CREATE INDEX "idx_social_accounts_user" ON "social_accounts"("user_id");
