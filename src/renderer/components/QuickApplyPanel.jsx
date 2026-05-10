export function QuickApplyPanel({ busy, onApply, onClear }) {
  return (
    <section className="panel" aria-labelledby="quick-apply-heading">
      <h2 id="quick-apply-heading">Quick apply</h2>
      <p className="panel-hint">
        Applies the addresses you set under <strong>DNS 1</strong> and <strong>DNS 2</strong> in Saved presets.
      </p>
      <div className="row">
        <button type="button" className="primary" disabled={busy} onClick={onApply}>
          Apply DNS to all services
        </button>
        <button type="button" className="danger" disabled={busy} onClick={onClear}>
          Clear DNS (use automatic)
        </button>
      </div>
    </section>
  )
}
