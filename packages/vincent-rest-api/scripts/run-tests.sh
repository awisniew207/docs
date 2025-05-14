#!/bin/bash

# Function to check if a port is in use
is_port_in_use() {
  lsof -i:"$1" >/dev/null 2>&1
  return $?
}

# Kill any existing process on port 3000
if is_port_in_use 3000; then
  echo "Port 3000 is already in use. Killing the process..."
  fuser -k 3000/tcp
  sleep 1
fi

echo "Starting the API server..."
npx ts-node src/tests/server.ts &
SERVER_PID=$!

# Ensure the server is terminated when the script exits
trap "echo 'Cleaning up server process...'; kill -9 $SERVER_PID 2>/dev/null || true" EXIT

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

echo "Running integration tests..."
npx jest src/tests/integration.test.ts

# Server will be cleaned up by the trap
echo "Tests completed." 