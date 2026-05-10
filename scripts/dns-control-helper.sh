#!/bin/bash
# Installed to /usr/local/libexec/dns-control-helper.sh — only callable via sudo for dns-control.
set -euo pipefail

valid_ipv4() {
  [[ "$1" =~ ^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$ ]] || return 1
  for o in "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}" "${BASH_REMATCH[4]}"; do
    (( o <= 255 )) || return 1
  done
  return 0
}

run_clear() {
  while IFS= read -r SERVICE; do
    [[ -z "$SERVICE" ]] && continue
    [[ "$SERVICE" == \** ]] && continue
    networksetup -setdnsservers "$SERVICE" empty
  done < <(networksetup -listallnetworkservices | sed '1d')
}

run_apply() {
  local IPS=("$@")
  (( ${#IPS[@]} >= 1 )) || exit 2
  for ip in "${IPS[@]}"; do
    valid_ipv4 "$ip" || exit 2
  done
  while IFS= read -r SERVICE; do
    [[ -z "$SERVICE" ]] && continue
    [[ "$SERVICE" == \** ]] && continue
    networksetup -setdnsservers "$SERVICE" "${IPS[@]}"
  done < <(networksetup -listallnetworkservices | sed '1d')
}

case "${1:-}" in
  test)
    exit 0
    ;;
  clear)
    run_clear
    ;;
  apply)
    shift
    run_apply "$@"
    ;;
  *)
    echo "usage: dns-control-helper.sh test | clear | apply <ip> [<ip>...]" >&2
    exit 2
    ;;
esac
