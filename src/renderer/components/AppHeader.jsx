export function AppHeader() {
  return (
    <header className="app-header">
      <h1>DNS Control</h1>
      <p className="sub">
        Set or clear DNS on all active macOS network services using <code className="code-inline">networksetup</code>{' '}
        (needs admin). Install the optional helper below <strong>once</strong> so Apply/Clear usually stop asking for a
        password.
      </p>
      <p className="sub note-quarantine">
        <code className="code-inline code-inline--sm">sudo xattr -rd com.apple.quarantine App.app</code> only removes
        the <em>download quarantine</em> (Gatekeeper “can’t open” warnings). It does <strong>not</strong> grant
        permission to change DNS — spelling is <code className="code-inline code-inline--sm">com.apple.quarantine</code>.
      </p>
    </header>
  )
}
