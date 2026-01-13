#!/bin/bash
set -e

# Container name
CONTAINER_NAME="workouts-db-1"
DB_USER="user"
DB_NAME="workouts"
OUTPUT_FILE="workouts_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "Backing up database from $CONTAINER_NAME..."

# Dump and gzip
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME | gzip > $OUTPUT_FILE

echo "Backup created at $OUTPUT_FILE"
