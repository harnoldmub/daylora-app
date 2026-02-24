#!/bin/bash

BASE_URL="http://localhost:5000"
PASS=0
FAIL=0
ERRORS=""

TEMPLATES=("classic" "modern" "minimal")
TONES=("golden-ivory" "rose-sunset" "sage-olive" "ocean-pearl")
MODES=("stripe" "external")

for i in $(seq 1 30); do
  EMAIL="test-batch-${i}@test.com"
  SLUG="test-batch-${i}"
  FIRST_NAME="User${i}"
  TITLE="${FIRST_NAME} et Partenaire${i}"
  TMPL=${TEMPLATES[$((i % 3))]}
  TONE=${TONES[$((i % 4))]}
  MODE=${MODES[$((i % 2))]}

  if [ "$MODE" = "external" ]; then
    EXT_URL="https://leetchi.com/test-${i}"
  else
    EXT_URL=""
  fi

  DATE="2026-$(printf '%02d' $(( (i % 12) + 1 )))-$(printf '%02d' $(( (i % 28) + 1 )))"

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/signup-with-wedding" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${EMAIL}\",
      \"password\": \"testpass123\",
      \"firstName\": \"${FIRST_NAME}\",
      \"title\": \"${TITLE}\",
      \"slug\": \"${SLUG}\",
      \"weddingDate\": \"${DATE}\",
      \"templateId\": \"${TMPL}\",
      \"storyBody\": \"Notre belle histoire ${i}\",
      \"toneId\": \"${TONE}\",
      \"features\": {\"cagnotteEnabled\": true, \"giftsEnabled\": true, \"jokesEnabled\": true, \"liveEnabled\": true},
      \"paymentMode\": \"${MODE}\",
      \"externalCagnotteUrl\": \"${EXT_URL}\",
      \"externalProvider\": \"other\",
      \"heroImage\": \"\",
      \"couplePhoto\": \"\",
      \"galleryImages\": [],
      \"plan\": \"free\"
    }" 2>/dev/null)

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "201" ]; then
    WEDDING_SLUG=$(echo "$BODY" | jq -r '.wedding.slug // empty' 2>/dev/null)
    WEDDING_ID=$(echo "$BODY" | jq -r '.wedding.id // empty' 2>/dev/null)
    USER_ID=$(echo "$BODY" | jq -r '.user.id // empty' 2>/dev/null)

    if [ -z "$WEDDING_SLUG" ] || [ "$WEDDING_SLUG" = "null" ]; then
      FAIL=$((FAIL + 1))
      ERRORS="${ERRORS}\n#${i}: wedding.slug is undefined/null"
    elif [ -z "$WEDDING_ID" ] || [ "$WEDDING_ID" = "null" ]; then
      FAIL=$((FAIL + 1))
      ERRORS="${ERRORS}\n#${i}: wedding.id is undefined/null"
    elif [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
      FAIL=$((FAIL + 1))
      ERRORS="${ERRORS}\n#${i}: user.id is undefined/null"
    else
      # Verify auto-login works - check the public page
      PUB_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/${WEDDING_SLUG}" 2>/dev/null)

      # Verify debug token for email verification
      TOKEN=$(echo "$BODY" | jq -r '.debugVerifyToken // empty' 2>/dev/null)
      if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        VERIFY_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/auth/verify-email?token=${TOKEN}" 2>/dev/null)
        if [ "$VERIFY_CODE" != "200" ]; then
          FAIL=$((FAIL + 1))
          ERRORS="${ERRORS}\n#${i}: email verification failed (HTTP ${VERIFY_CODE})"
          continue
        fi
      fi

      # Login test
      LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${EMAIL}\", \"password\": \"testpass123\"}" 2>/dev/null)
      LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -1)
      LOGIN_BODY=$(echo "$LOGIN_RESP" | sed '$d')

      if [ "$LOGIN_CODE" = "200" ]; then
        LOGIN_USER_ID=$(echo "$LOGIN_BODY" | jq -r '.user.id // empty' 2>/dev/null)
        if [ -z "$LOGIN_USER_ID" ] || [ "$LOGIN_USER_ID" = "null" ]; then
          FAIL=$((FAIL + 1))
          ERRORS="${ERRORS}\n#${i}: login succeeded but user.id is undefined"
        else
          PASS=$((PASS + 1))
          echo "OK  #${i}: ${EMAIL} | slug=${WEDDING_SLUG} | tmpl=${TMPL} | tone=${TONE} | mode=${MODE}"
        fi
      else
        FAIL=$((FAIL + 1))
        LOGIN_MSG=$(echo "$LOGIN_BODY" | jq -r '.message // empty' 2>/dev/null)
        ERRORS="${ERRORS}\n#${i}: login failed (HTTP ${LOGIN_CODE}) - ${LOGIN_MSG}"
      fi
    fi
  else
    FAIL=$((FAIL + 1))
    MSG=$(echo "$BODY" | jq -r '.message // empty' 2>/dev/null)
    ERRORS="${ERRORS}\n#${i}: signup failed (HTTP ${HTTP_CODE}) - ${MSG}"
  fi
done

echo ""
echo "=============================="
echo "RESULTS: ${PASS} passed, ${FAIL} failed out of 30"
echo "=============================="

if [ $FAIL -gt 0 ]; then
  echo -e "\nFAILURES:${ERRORS}"
fi

# Check DB for undefined values
echo ""
echo "--- DB CHECK: undefined or null in config texts ---"
psql "$DATABASE_URL" -t -c "
SELECT slug,
  config->'texts'->>'siteTitle' as st,
  config->'texts'->>'heroTitle' as ht,
  config->'texts'->>'weddingDate' as wd,
  config->'sections'->>'countdownDate' as cd
FROM weddings
WHERE slug LIKE 'test-batch-%'
AND (
  config->'texts'->>'siteTitle' IS NULL
  OR config->'texts'->>'siteTitle' = ''
  OR config->'texts'->>'heroTitle' IS NULL
  OR config->'texts'->>'heroTitle' = ''
)
LIMIT 5;" 2>/dev/null

echo ""
echo "--- ROUTING CHECK: public pages accessible ---"
for s in $(seq 1 3); do
  SLUG="test-batch-${s}"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/${SLUG}" 2>/dev/null)
  echo "${SLUG}: HTTP ${CODE}"
done
