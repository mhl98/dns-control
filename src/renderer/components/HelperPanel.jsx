const DEFAULT_INSTALL_PATH = '/usr/local/libexec/dns-control-helper.sh'

export function HelperPanel({ busy, helperStatus, onInstall, onUninstall }) {
  return (
    <section className="panel panel-helper" aria-labelledby="helper-heading">
      <h2 id="helper-heading">Password (one-time option)</h2>
      {helperStatus ? (
        <>
          <p className="panel-hint helper-line">
            <HelperStatusMessage status={helperStatus} />
          </p>
          <p className="muted tiny">
            Installs <code className="code-inline code-inline--xs">{helperStatus.installPath ?? DEFAULT_INSTALL_PATH}</code>{' '}
            and a matching <code className="code-inline code-inline--xs">sudoers.d</code> rule for your user only.
          </p>
          <div className="row">
            <button
              type="button"
              className="primary"
              disabled={busy || helperStatus.passwordless}
              onClick={onInstall}
            >
              {helperStatus.installed ? 'Reinstall helper' : 'Install helper (one password)'}
            </button>
            <button type="button" className="ghost" disabled={busy || !helperStatus.installed} onClick={onUninstall}>
              Remove helper
            </button>
          </div>
        </>
      ) : (
        <p className="muted">Checking helper status…</p>
      )}
    </section>
  )
}

function HelperStatusMessage({ status }) {
  if (status.passwordless) {
    return <span className="helper-ok">Helper active — Apply/Clear should run without a password prompt.</span>
  }
  if (status.installed) {
    return (
      <span>
        Helper script is installed, but passwordless <code className="code-inline code-inline--xs">sudo</code> was not
        detected. Try Install again or apply DNS once.
      </span>
    )
  }
  return (
    <span>
      Not installed. Each Apply/Clear can show a macOS password dialog unless you install the helper (one admin prompt
      during install).
    </span>
  )
}
