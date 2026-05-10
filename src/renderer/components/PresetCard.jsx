import { memo } from 'react'

function PresetCardInner({ preset, busy, onApply, onRemove }) {
  return (
    <div className="preset-card">
      <div>
        <strong>{preset.name}</strong>
        <span>{preset.servers.join(' · ')}</span>
      </div>
      <div className="preset-actions">
        <button type="button" className="primary small" disabled={busy} onClick={() => onApply(preset.servers)}>
          Apply
        </button>
        <button type="button" className="ghost small" disabled={busy} onClick={() => onRemove(preset.id)}>
          Remove
        </button>
      </div>
    </div>
  )
}

export const PresetCard = memo(PresetCardInner)
