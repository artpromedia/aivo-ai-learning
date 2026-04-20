#!/bin/bash
set -e

echo "Starting AIVO backend services..."

TSX_BIN=$(which tsx 2>/dev/null || echo "npx tsx")

echo "Starting identity-svc on port 3001..."
cd /home/runner/workspace/services/identity-svc
NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting assessment-svc on port 3003..."
cd /home/runner/workspace/services/assessment-svc
mkdir -p /tmp/svc-logs
ASSESSMENT_PORT=3003 NODE_ENV=development $TSX_BIN src/index.ts > /tmp/svc-logs/assessment-svc.log 2>&1 &

echo "Starting learning-svc on port 3005..."
cd /home/runner/workspace/services/learning-svc
LEARNING_PORT=3005 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting tutor-svc on port 3006..."
cd /home/runner/workspace/services/tutor-svc
TUTOR_PORT=3006 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting family-svc on port 3007..."
cd /home/runner/workspace/services/family-svc
FAMILY_PORT=3007 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting engagement-svc on port 3008..."
cd /home/runner/workspace/services/engagement-svc
ENGAGEMENT_PORT=3008 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting billing-svc on port 3009..."
cd /home/runner/workspace/services/billing-svc
BILLING_SVC_PORT=3009 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting comms-svc on port 3010..."
cd /home/runner/workspace/services/comms-svc
COMMS_SVC_PORT=3010 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting i18n-svc on port 3011..."
cd /home/runner/workspace/services/i18n-svc
I18N_SVC_PORT=3011 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting integrations-svc on port 3012..."
cd /home/runner/workspace/services/integrations-svc
INTEGRATIONS_SVC_PORT=3012 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting admin-svc on port 3013..."
cd /home/runner/workspace/services/admin-svc
ADMIN_SVC_PORT=3013 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting status-page-svc on port 3014..."
cd /home/runner/workspace/services/status-page-svc
STATUS_PAGE_SVC_PORT=3014 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting research-svc on port 3015..."
cd /home/runner/workspace/services/research-svc
RESEARCH_SVC_PORT=3015 NODE_ENV=development $TSX_BIN src/index.ts &

echo "Starting ai-svc on port 3004..."
cd /home/runner/workspace/services/ai-svc
PYTHONPATH=src python3 -m uvicorn ai_svc.main:app --host 0.0.0.0 --port 3004 &

wait
