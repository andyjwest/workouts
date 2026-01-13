---
description: How to deploy the database to a remote server on your Tailscale network
---

# Deploy Database to Tailscale Server

Follow these steps to migrate your local database to a remote server.

## 1. Prepare Local Backup

Run the included helper script to create a compressed dump of your local database:

```bash
chmod +x scripts/backup_db.sh
./scripts/backup_db.sh
```

This will create a file like `workouts_backup_20250101_120000.sql.gz`.

## 2. Transfer Files to Remote Server

Use `scp` to copy the backup, `docker-compose.yml`, and `init.sql` to your remote server. Replace `your-server-name` with your Tailscale machine name or IP.

```bash
# Export variables for convenience
SERVER="your-server-name"
USER="your-username"
DEST_DIR="~/workouts-deploy"

# Create directory on remote
ssh $USER@$SERVER "mkdir -p $DEST_DIR"

# Copy files
scp docker-compose.yml init.sql workouts_backup_*.sql.gz $USER@$SERVER:$DEST_DIR/
```

## 3. Deploy on Remote Server

SSH into your remote server:
```bash
ssh $USER@$SERVER
cd ~/workouts-deploy
```

Start the database service:
```bash
docker compose up -d db
```

Wait a few seconds for it to initialize.

## 4. Restore Data

Unzip the backup and restore it into the running container.

```bash
# Identify the backup file
BACKUP_FILE=$(ls workouts_backup_*.sql.gz | head -n 1)

# Unzip (this removes the .gz extension)
gzip -d $BACKUP_FILE
SQL_FILE=${BACKUP_FILE%.gz}

# Drop existing data (optional, but ensures clean state) 
# WARNING: This deletes data on the REMOTE DB.
docker compose exec -T db psql -U user -d workouts -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore
cat $SQL_FILE | docker compose exec -T db psql -U user -d workouts
```

## 5. Verify

Check that your data is there:
```bash
docker compose exec -T db psql -U user -d workouts -c "SELECT count(*) FROM workouts;"
```
