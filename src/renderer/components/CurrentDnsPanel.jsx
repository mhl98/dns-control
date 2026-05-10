import { useMemo } from 'react'

export function CurrentDnsPanel({ dnsByService, busy, onRefresh }) {
  const rows = useMemo(() => Object.entries(dnsByService), [dnsByService])
  const isEmpty = rows.length === 0

  return (
    <section className="panel" aria-labelledby="current-dns-heading">
      <h2 id="current-dns-heading">Current DNS</h2>
      <div className="row">
        <button type="button" className="ghost small" onClick={onRefresh} disabled={busy}>
          Refresh
        </button>
      </div>
      {isEmpty ? (
        <p className="muted">No services listed, or still loading.</p>
      ) : (
        <table className="dns-table">
          <tbody>
            {rows.map(([service, ips]) => (
              <tr key={service}>
                <th scope="row">{service}</th>
                <td>{ips.length ? ips.join(', ') : 'empty (automatic)'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
