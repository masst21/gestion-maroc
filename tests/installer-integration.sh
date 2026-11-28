#!/bin/bash
set -euo pipefail
umask 077
export PGHOST=127.0.0.1 PGPORT=5432 PGUSER=installer_test PGPASSWORD=test_only_password PGDATABASE=install_test
config=$(mktemp)
restored=$(mktemp)
dump=$(mktemp)
server_pid=''
trap 'if [ -n "$server_pid" ]; then kill "$server_pid" 2>/dev/null || true; fi; rm -f "$config" "$restored" "$dump"' EXIT
printf '%s\n' 'DATABASE_URL=postgresql://installer_test:test_only_password@127.0.0.1:5432/install_test' 'PORT=3100' 'HOSTNAME=127.0.0.1' > "$config"
printf '%s' '{"confirm":"127.0.0.1:5432/install_test","store":"Magasin fictif","fullName":"Test admin","email":"installer@example.invalid","password":"Synthetic-test-password-123!"}' | candidate/runtime/node candidate/setup-server.cjs "$config" new --input-stdin
[ "$(psql -XqAt -c 'SELECT count(*) FROM "User"')" = 1 ]
[ "$(psql -XqAt -c 'SELECT count(*) FROM "Store"')" = 1 ]
[ "$(psql -XqAt -c 'SELECT count(*) FROM "Client"')" = 0 ]
if printf '%s' '{"confirm":"127.0.0.1:5432/install_test","store":"No overwrite","fullName":"Test admin","email":"other@example.invalid","password":"Synthetic-test-password-123!"}' | candidate/runtime/node candidate/setup-server.cjs "$config" new --input-stdin; then echo 'Duplicate initialization accepted'; exit 1; fi
if printf '%s' '{"confirm":"wrong"}' | candidate/runtime/node candidate/setup-server.cjs "$config" existing --input-stdin; then echo 'Wrong identity accepted'; exit 1; fi
printf '%s' '{"confirm":"127.0.0.1:5432/install_test"}' | candidate/runtime/node candidate/setup-server.cjs "$config" existing --input-stdin
pg_dump --format=custom --file="$dump"
test -s "$dump"
createdb install_restore
pg_restore --exit-on-error --dbname=install_restore "$dump"
[ "$(PGDATABASE=install_restore psql -XqAt -c 'SELECT count(*) FROM "User"')" = 1 ]
[ "$(PGDATABASE=install_restore psql -XqAt -c 'SELECT count(*) FROM "Store"')" = 1 ]
printf '%s\n' 'DATABASE_URL=postgresql://installer_test:test_only_password@127.0.0.1:5432/install_restore' 'PORT=3100' 'HOSTNAME=127.0.0.1' > "$restored"
candidate/runtime/node candidate/start-server.cjs "$restored" > /tmp/installer-server.log 2>&1 &
server_pid=$!
for i in $(seq 1 60); do if curl -fsS http://127.0.0.1:3100/login >/dev/null; then break; fi; sleep 1; done
candidate/runtime/node tests/installer-sessions.mjs
