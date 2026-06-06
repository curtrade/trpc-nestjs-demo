#!/usr/bin/env bash
#
# demo-call.sh — boot the three services and walk the whole flow through the
# public REST edge, so you can watch the tRPC mesh work end to end.
#
#   Cart (:3000, REST)  ──tRPC──▶  Auth (:3001)
#                       └─tRPC──▶  Catalog (:3002)
#
# It builds, starts all three in the background, waits for them to come up,
# fires a sequence of curls (happy paths + every error code), then tears the
# whole thing down on exit. Re-runnable: it frees the ports first.
#
# Usage:  ./demo-call.sh
set -euo pipefail

cd "$(dirname "$0")"

AUTH_PORT=3001
CATALOG_PORT=3002
CART_PORT=3000
CART_URL="http://localhost:${CART_PORT}"

PIDS=()

cleanup() {
  echo
  echo "── tearing down ──"
  for pid in "${PIDS[@]:-}"; do
    [ -n "${pid:-}" ] && kill "$pid" 2>/dev/null || true
  done
  # belt and suspenders: free the ports even if a child outlived its parent
  for port in "$AUTH_PORT" "$CATALOG_PORT" "$CART_PORT"; do
    pids=$(lsof -ti "tcp:${port}" 2>/dev/null || true)
    [ -n "$pids" ] && kill $pids 2>/dev/null || true
  done
}
trap cleanup EXIT

free_ports() {
  for port in "$AUTH_PORT" "$CATALOG_PORT" "$CART_PORT"; do
    pids=$(lsof -ti "tcp:${port}" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      echo "freeing port ${port} (killing ${pids})"
      kill $pids 2>/dev/null || true
    fi
  done
}

wait_for() {
  local url=$1 name=$2 tries=0
  until curl -s -o /dev/null "$url"; do
    tries=$((tries + 1))
    if [ "$tries" -gt 50 ]; then
      echo "ERROR: ${name} did not come up at ${url}" >&2
      exit 1
    fi
    sleep 0.2
  done
  echo "  ✓ ${name} up"
}

hr() { printf '%s\n' "────────────────────────────────────────────────────────"; }

# A POST that prints the HTTP status and the JSON body.
post_item() {
  local token=$1 item=$2 qty=$3
  curl -s -w '\n  HTTP %{http_code}\n' \
    -X POST "${CART_URL}/cart/items" \
    -H "x-session-token: ${token}" \
    -H 'content-type: application/json' \
    -d "{\"itemId\":\"${item}\",\"qty\":${qty}}"
}

get_cart() {
  local token=$1
  curl -s -w '\n  HTTP %{http_code}\n' \
    "${CART_URL}/cart" -H "x-session-token: ${token}"
}

echo "── building all packages (topological order: shared first) ──"
pnpm -s build >/dev/null
echo "  ✓ build complete"

free_ports

echo "── starting services ──"
PORT=$AUTH_PORT node packages/auth-service/dist/main.js >/tmp/demo-auth.log 2>&1 &
PIDS+=("$!")
PORT=$CATALOG_PORT node packages/catalog-service/dist/main.js >/tmp/demo-catalog.log 2>&1 &
PIDS+=("$!")
PORT=$CART_PORT \
  AUTH_URL="http://localhost:${AUTH_PORT}/trpc" \
  CATALOG_URL="http://localhost:${CATALOG_PORT}/trpc" \
  node packages/cart-service/dist/main.js >/tmp/demo-cart.log 2>&1 &
PIDS+=("$!")

# Auth/Catalog answer tRPC GETs; Cart answers REST. Any 2xx/4xx means "listening".
wait_for "http://localhost:${AUTH_PORT}/trpc/session.whoami?input=%7B%22token%22%3A%22s1%22%7D" "auth"
wait_for "http://localhost:${CATALOG_PORT}/trpc/item.byId?input=%7B%22id%22%3A%22i1%22%7D" "catalog"
wait_for "${CART_URL}/cart" "cart"

hr
echo "1) Alice (s1) adds 2× Coffee Mug (i1) — Cart asks Auth who she is,"
echo "   then Catalog for the price, both over tRPC. Expect total 2400."
post_item s1 i1 2

hr
echo "2) GET /cart for Alice — persisted cart comes back."
get_cart s1

hr
echo "3) Bob (s2) adds 1× T-Shirt (i2) — independent cart, total 2500."
post_item s2 i2 1

hr
echo "4) Error paths (the nullable contract becomes HTTP status codes):"
echo "   a) unknown session  → 401"
post_item bad i1 1
echo "   b) unknown item     → 404"
post_item s1 no-such-item 1
echo "   c) out-of-stock i3  → 409"
post_item s1 i3 1
echo "   d) invalid body qty → 400"
post_item s1 i1 0

hr
echo "Done. Logs: /tmp/demo-auth.log /tmp/demo-catalog.log /tmp/demo-cart.log"
