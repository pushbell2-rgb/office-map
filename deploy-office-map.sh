#!/usr/bin/env bash
# office-map 배포 스크립트
# 운영 서버의 자리 정보(positions.json)를 받아 커밋한 뒤 main에 push → Render 자동 배포
# 사용법: ./deploy-office-map.sh   (코드 변경은 미리 커밋해 둘 것)
set -euo pipefail

cd "$(dirname "$0")"

URL="https://office-map.onrender.com/api/positions"
TARGET="office-map/backend/positions.json"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

echo "[1/3] 운영 서버에서 자리 정보 받는 중..."
# --ssl-no-revoke: 사내망에서 인증서 폐기 확인 실패(CRYPT_E_NO_REVOCATION_CHECK) 회피
curl -fsS --ssl-no-revoke -m 90 "$URL" -o "$TMP"

# JSON 검증 + 서버가 재시작돼 비어 있는데 로컬엔 데이터가 있으면 덮어쓰기 중단
node -e '
const fs = require("fs");
const live = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
if (typeof live !== "object" || Array.isArray(live)) throw new Error("형식 오류");
let local = {};
try { local = JSON.parse(fs.readFileSync(process.argv[2], "utf8") || "{}"); } catch (e) {}
const n = Object.keys(live).length, m = Object.keys(local).length;
if (n === 0 && m > 0) { console.error(`서버 데이터가 비어 있음(로컬 ${m}명). 중단합니다.`); process.exit(1); }
fs.writeFileSync(process.argv[2], JSON.stringify(live, null, 2));
console.log(`  → ${n}명 저장`);
' "$TMP" "$TARGET"

echo "[2/3] 커밋..."
git add "$TARGET"
if git diff --cached --quiet -- "$TARGET"; then
  echo "  → 자리 정보 변경 없음"
else
  git commit -m "chore: 운영 서버 자리 정보 동기화" -- "$TARGET"
fi

echo "[3/3] push → Render 자동 배포"
git push origin main
