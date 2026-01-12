#!/bin/bash

# Use the virtual environment python
VENV_PYTHON="./.venv/bin/python"
VENV_UVICORN="./.venv/bin/uvicorn"

if [ ! -f "$VENV_PYTHON" ]; then
    echo "Virtual environment not found at ./.venv"
    echo "Please create one or ensure it exists."
    exit 1
fi

# Install uvicorn if not present in venv
if ! $VENV_PYTHON -c "import uvicorn" &> /dev/null; then
    echo "Installing uvicorn in venv..."
    $VENV_PYTHON -m pip install uvicorn
fi

# Run the app
echo "Starting backend server..."
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=user
export DB_PASSWORD=password
export DB_NAME=workouts
$VENV_PYTHON -m uvicorn main:app --reload --host 0.0.0.0 --port 8900
