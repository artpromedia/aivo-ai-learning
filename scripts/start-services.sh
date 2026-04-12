#!/bin/bash
set -e

echo "Starting AIVO backend services..."

echo "Starting identity-svc on port 3001..."
cd /home/runner/workspace/services/identity-svc
NODE_ENV=development npx tsx src/index.ts &

echo "Starting assessment-svc on port 3003..."
cd /home/runner/workspace/services/assessment-svc
ASSESSMENT_PORT=3003 NODE_ENV=development npx tsx src/index.ts &

echo "Starting learning-svc on port 3005..."
cd /home/runner/workspace/services/learning-svc
LEARNING_PORT=3005 NODE_ENV=development npx tsx src/index.ts &

echo "Starting tutor-svc on port 3006..."
cd /home/runner/workspace/services/tutor-svc
TUTOR_PORT=3006 NODE_ENV=development npx tsx src/index.ts &

echo "Starting family-svc on port 3007..."
cd /home/runner/workspace/services/family-svc
FAMILY_PORT=3007 NODE_ENV=development npx tsx src/index.ts &

echo "Starting engagement-svc on port 3008..."
cd /home/runner/workspace/services/engagement-svc
ENGAGEMENT_PORT=3008 NODE_ENV=development npx tsx src/index.ts &

wait
