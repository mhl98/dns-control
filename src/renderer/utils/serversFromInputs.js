/** Normalize DNS text fields into a non-empty list of trimmed strings. */
export function serversFromIpInputs(ip1, ip2) {
  return [ip1, ip2].map((s) => String(s).trim()).filter(Boolean)
}
