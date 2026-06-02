CREATE TYPE "WorkspaceMembership" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TABLE "workspaces" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "logo_url" TEXT,
  "created_by" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workspaces_slug_key" UNIQUE ("slug"),
  CONSTRAINT "workspaces_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "user_workspaces" (
  "user_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "membership" "WorkspaceMembership" NOT NULL DEFAULT 'MEMBER',
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "user_workspaces_pkey" PRIMARY KEY ("user_id", "workspace_id"),
  CONSTRAINT "user_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_workspaces_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "roles" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "workspace_id" UUID,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roles_workspace_id_code_key" UNIQUE ("workspace_id", "code"),
  CONSTRAINT "roles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "user_roles" (
  "user_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,

  CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id", "workspace_id"),
  CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_roles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "user_sessions" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" UUID NOT NULL,
  "refresh_token_hash" TEXT NOT NULL,
  "device_info" TEXT,
  "ip_address" VARCHAR(45),
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "idx_workspaces_slug" ON "workspaces"("slug");
CREATE INDEX "idx_user_workspaces_user" ON "user_workspaces"("user_id");
CREATE INDEX "idx_user_workspaces_workspace" ON "user_workspaces"("workspace_id");
CREATE INDEX "idx_roles_workspace" ON "roles"("workspace_id");
CREATE INDEX "idx_user_roles_user" ON "user_roles"("user_id");
CREATE INDEX "idx_user_roles_workspace" ON "user_roles"("workspace_id");
CREATE INDEX "idx_sessions_user" ON "user_sessions"("user_id");
CREATE INDEX "idx_sessions_expires" ON "user_sessions"("expires_at");
