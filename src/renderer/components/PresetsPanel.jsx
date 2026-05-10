import { PresetCard } from './PresetCard.jsx'

export function PresetsPanel({
  busy,
  ipPrimary,
  ipSecondary,
  presetName,
  onIpPrimaryChange,
  onIpSecondaryChange,
  onPresetNameChange,
  onSavePreset,
  presets,
  onApplyServers,
  onRemovePreset,
}) {
  const hasPresets = presets.length > 0

  return (
    <section className="panel" aria-labelledby="presets-heading">
      <h2 id="presets-heading">Saved presets</h2>

      <div className="ip-grid preset-dns">
        <div>
          <label htmlFor="dns-ip-primary">DNS 1</label>
          <input
            id="dns-ip-primary"
            name="dnsPrimary"
            autoComplete="off"
            value={ipPrimary}
            onChange={(e) => onIpPrimaryChange(e.target.value)}
            placeholder="e.g. 1.1.1.1"
          />
        </div>
        <div>
          <label htmlFor="dns-ip-secondary">DNS 2 (optional)</label>
          <input
            id="dns-ip-secondary"
            name="dnsSecondary"
            autoComplete="off"
            value={ipSecondary}
            onChange={(e) => onIpSecondaryChange(e.target.value)}
            placeholder="optional"
          />
        </div>
      </div>

      <div className="preset-add">
        <label htmlFor="preset-name">Preset name</label>
        <input
          id="preset-name"
          name="presetName"
          autoComplete="off"
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
          placeholder="e.g. Shecan, Cloudflare"
        />
        <button type="button" className="ghost" disabled={busy} onClick={onSavePreset}>
          Save preset
        </button>
      </div>

      {!hasPresets ? (
        <p className="muted preset-list-intro">No saved presets yet. Enter IPs above, a name, and Save preset.</p>
      ) : (
        <div className="presets">
          {presets.map((p) => (
            <PresetCard key={p.id} preset={p} busy={busy} onApply={onApplyServers} onRemove={onRemovePreset} />
          ))}
        </div>
      )}
    </section>
  )
}
