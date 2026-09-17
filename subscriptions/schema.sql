PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  customer TEXT NOT NULL,
  plan TEXT NOT NULL,
  expires INTEGER NOT NULL,
  max_devices INTEGER NOT NULL CHECK(max_devices BETWEEN 1 AND 20),
  suspended INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  device_id TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY(subscription_id, device_id)
);
CREATE TRIGGER IF NOT EXISTS device_limit BEFORE INSERT ON devices
WHEN NOT EXISTS (SELECT 1 FROM devices WHERE subscription_id=NEW.subscription_id AND device_id=NEW.device_id)
AND (SELECT COUNT(*) FROM devices WHERE subscription_id=NEW.subscription_id) >=
    (SELECT max_devices FROM subscriptions WHERE id=NEW.subscription_id)
BEGIN SELECT RAISE(ABORT, 'DEVICE_LIMIT'); END;
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id TEXT NOT NULL,
  action TEXT NOT NULL,
  created INTEGER NOT NULL
);
