#!/bin/bash

# Simple script to sync .env.local with Vercel using the Vercel CLI
# Usage: ./scripts/sync-env.sh [environment] (default: preview)

ENV_TYPE=${1:-preview}

echo "Syncing .env.local to Vercel ($ENV_TYPE)..."

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ ]] && continue
  [[ -z "$line" ]] && continue

  # Extract key and value
  KEY=$(echo "$line" | cut -d '=' -f 1)
  VALUE=$(echo "$line" | cut -d '=' -f 2-)

  # Trim quotes if present
  VALUE=${VALUE#\"}
  VALUE=${VALUE%\"}

  if [ -n "$KEY" ] && [ -n "$VALUE" ]; then
    echo "Pushing $KEY..."
    echo -n "$VALUE" | vercel env add "$KEY" "$ENV_TYPE"
  fi
done < .env.local

echo "Sync complete."
