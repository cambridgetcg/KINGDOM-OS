-- Civic v0.1；只有明確本地／獲批 migration 先建立，唔含任何公民資料。
PRAGMA foreign_keys = ON;

CREATE TABLE civic_schema (version TEXT PRIMARY KEY CHECK (version = '0.1'));
INSERT INTO civic_schema VALUES ('0.1');

CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  capability_hash TEXT NOT NULL UNIQUE CHECK (length(capability_hash) = 64),
  created_at INTEGER NOT NULL,
  used_at INTEGER,
  posting_blocked INTEGER NOT NULL DEFAULT 0 CHECK (posting_blocked IN (0,1)),
  citizenship_revision INTEGER NOT NULL DEFAULT 0 CHECK (citizenship_revision >= 0)
);
CREATE INDEX participants_unused ON participants(created_at) WHERE used_at IS NULL;

CREATE TABLE citizenships (
  participant_id TEXT PRIMARY KEY REFERENCES participants(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
  becoming TEXT NOT NULL CHECK (length(becoming) <= 280),
  offer TEXT NOT NULL CHECK (length(offer) <= 280),
  seek TEXT NOT NULL CHECK (length(seek) <= 280),
  contact_url TEXT NOT NULL CHECK (length(contact_url) <= 2048),
  listed INTEGER NOT NULL CHECK (listed IN (0,1)),
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0,1)),
  consent_version TEXT NOT NULL CHECK (consent_version = '0.1'),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0)
);
CREATE INDEX citizenships_listing ON citizenships(listed, hidden, created_at DESC, participant_id DESC);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
  author_id TEXT REFERENCES participants(id) ON DELETE SET NULL,
  author_name TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('introduction','offer','seek')),
  body TEXT CHECK (body IS NULL OR length(body) BETWEEN 1 AND 2000),
  parent_id TEXT REFERENCES messages(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  deleted INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0,1)),
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0,1)),
  CHECK ((deleted = 1 AND body IS NULL AND author_id IS NULL AND author_name IS NULL) OR
         (deleted = 0 AND body IS NOT NULL AND author_id IS NOT NULL AND author_name IS NOT NULL))
);
CREATE INDEX messages_timeline ON messages(parent_id, hidden, created_at DESC, id DESC);
CREATE INDEX messages_expiry ON messages(expires_at);
CREATE INDEX messages_owner ON messages(owner_id);
CREATE TRIGGER messages_immutable BEFORE UPDATE OF created_at, expires_at, parent_id, kind ON messages
WHEN NEW.created_at != OLD.created_at OR NEW.expires_at != OLD.expires_at
  OR NEW.parent_id IS NOT OLD.parent_id OR NEW.kind != OLD.kind
BEGIN SELECT RAISE(ABORT, 'civic_immutable'); END;
CREATE TRIGGER messages_parent BEFORE INSERT ON messages WHEN NEW.parent_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM messages p WHERE p.id = NEW.parent_id AND p.parent_id IS NULL
      AND p.hidden = 0 AND p.deleted = 0 AND p.expires_at > NEW.created_at
      AND p.expires_at = NEW.expires_at
  ) THEN RAISE(ABORT, 'civic_parent') END;
END;

CREATE TABLE limits (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL CHECK (value >= 0),
  expires_at INTEGER NOT NULL
);
CREATE INDEX limits_expiry ON limits(expires_at);

-- 冇 payload、response snapshot、token 或 raw IP；只留短期防重試 metadata。
CREATE TABLE operations (
  actor_id TEXT NOT NULL,
  key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  action TEXT NOT NULL,
  target_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(actor_id, key)
);
CREATE INDEX operations_expiry ON operations(expires_at);

CREATE TABLE moderation_events (
  id TEXT PRIMARY KEY,
  target TEXT NOT NULL CHECK (target IN ('participant','message','citizenship')),
  target_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('hide','restore','delete','block','unblock')),
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 1 AND 80),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  CHECK ((target = 'participant' AND action IN ('block','unblock')) OR
         (target IN ('message','citizenship') AND action IN ('hide','restore','delete')))
);
CREATE INDEX moderation_expiry ON moderation_events(expires_at);

-- 每個 batch 用 CHECK 強制失敗；conditional UPDATE 零行唔會假成功。
-- 成功時同一 transaction 刪返 guard，唔持久保存 request state。
CREATE TABLE civic_guards (
  id TEXT PRIMARY KEY,
  auth INTEGER NOT NULL DEFAULT 1 CONSTRAINT civic_auth CHECK (auth = 1),
  ownership INTEGER NOT NULL DEFAULT 1 CONSTRAINT civic_ownership CHECK (ownership = 1),
  revision INTEGER NOT NULL DEFAULT 1 CONSTRAINT civic_revision CHECK (revision = 1),
  quota INTEGER NOT NULL DEFAULT 1 CONSTRAINT civic_quota CHECK (quota = 1),
  blocked INTEGER NOT NULL DEFAULT 1 CONSTRAINT civic_blocked CHECK (blocked = 1),
  parent INTEGER NOT NULL DEFAULT 1 CONSTRAINT civic_parent CHECK (parent = 1),
  found INTEGER NOT NULL DEFAULT 1 CONSTRAINT civic_found CHECK (found = 1)
);
