#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "Installing pnpm dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "Installing brain-svc Python dependencies..."
cd services/brain-svc && pip install -q -r requirements.txt 2>/dev/null; cd ../..

echo "Pushing database schema..."
pnpm --filter @aivo/db run db:push --force 2>/dev/null || true

echo "=== Post-merge setup complete ==="
