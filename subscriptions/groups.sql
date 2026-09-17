PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS subscription_groups (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, expires INTEGER NOT NULL,
 max_customers INTEGER NOT NULL CHECK(max_customers BETWEEN 1 AND 10000),
 max_devices INTEGER NOT NULL CHECK(max_devices BETWEEN 1 AND 100000),
 suspended INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS group_members (
 subscription_id TEXT PRIMARY KEY REFERENCES subscriptions(id),
 group_id TEXT NOT NULL REFERENCES subscription_groups(id)
);
CREATE INDEX IF NOT EXISTS group_members_group ON group_members(group_id);
CREATE TABLE IF NOT EXISTS blocked_devices (
 subscription_id TEXT NOT NULL REFERENCES subscriptions(id), device_id TEXT NOT NULL,
 PRIMARY KEY(subscription_id,device_id)
);
CREATE TRIGGER IF NOT EXISTS group_customer_limit BEFORE INSERT ON group_members
WHEN (SELECT COUNT(*) FROM group_members WHERE group_id=NEW.group_id)>=
 (SELECT max_customers FROM subscription_groups WHERE id=NEW.group_id)
BEGIN SELECT RAISE(ABORT,'GROUP_CUSTOMER_LIMIT'); END;
CREATE TRIGGER IF NOT EXISTS group_device_limit BEFORE INSERT ON devices
WHEN NOT EXISTS(SELECT 1 FROM devices WHERE subscription_id=NEW.subscription_id AND device_id=NEW.device_id)
AND EXISTS(SELECT 1 FROM group_members m JOIN subscription_groups g ON g.id=m.group_id
 WHERE m.subscription_id=NEW.subscription_id AND
 (SELECT COUNT(*) FROM devices d JOIN group_members n ON n.subscription_id=d.subscription_id WHERE n.group_id=g.id)>=g.max_devices)
BEGIN SELECT RAISE(ABORT,'GROUP_DEVICE_LIMIT'); END;
