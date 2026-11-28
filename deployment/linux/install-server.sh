#!/bin/sh
set -eu
[ "$(id -u)" = 0 ] || { echo 'Exécuter avec sudo.'; exit 1; }
[ "$#" = 2 ] || { echo 'Usage: install-server.sh /chemin/server.env new|existing'; exit 1; }
case "$2" in new|existing) ;; *) exit 1;; esac
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
[ ! -e /opt/monmagasin ] && [ ! -e /etc/monmagasin ] && [ ! -e /etc/systemd/system/monmagasin.service ] || { echo 'Installation existante : arrêt.'; exit 1; }
command -v psql >/dev/null
command -v systemctl >/dev/null
[ -f "$1" ] && [ -x "$root/runtime/node" ]
if ! id monmagasin >/dev/null 2>&1; then useradd --system --user-group --no-create-home --shell /usr/sbin/nologin monmagasin; fi
install -d -m 0750 -o root -g monmagasin /etc/monmagasin
install -m 0640 -o root -g monmagasin "$1" /etc/monmagasin/server.env
install -d -m 0755 /opt/monmagasin
cp -a "$root/." /opt/monmagasin/
chown -R root:root /opt/monmagasin
chmod -R go-w /opt/monmagasin
install -d -m 0750 -o monmagasin -g monmagasin /opt/monmagasin/app/.next/cache
chown -R monmagasin:monmagasin /opt/monmagasin/app/.next/cache
/opt/monmagasin/runtime/node /opt/monmagasin/setup-server.cjs /etc/monmagasin/server.env "$2"
install -m 0644 /opt/monmagasin/linux/monmagasin.service /etc/systemd/system/monmagasin.service
systemctl daemon-reload
systemctl enable --now monmagasin.service
systemctl status --no-pager monmagasin.service
