#!/bin/bash
# Hangar5 Healthcheck — no depende de LLM
# Este script se ejecuta vía cron y solo reporta si el sitio está caído

STATUS=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 15 --max-time 20 https://hangar5.onrender.com 2>/dev/null)
TABLES_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 15 --max-time 20 https://hangar5.onrender.com/api/health 2>/dev/null)

if [ "$STATUS" != "200" ]; then
  echo "ALERT: Hangar5 homepage returned HTTP $STATUS"
  exit 1
fi

# Only output if there's a problem
exit 0
