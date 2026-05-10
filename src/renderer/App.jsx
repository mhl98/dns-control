import { useDnsControl } from './hooks/useDnsControl.js'
import { AppHeader } from './components/AppHeader.jsx'
import { StatusBanner } from './components/StatusBanner.jsx'
import { HelperPanel } from './components/HelperPanel.jsx'
import { QuickApplyPanel } from './components/QuickApplyPanel.jsx'
import { PresetsPanel } from './components/PresetsPanel.jsx'
import { CurrentDnsPanel } from './components/CurrentDnsPanel.jsx'

export default function App() {
  const {
    dnsByService,
    presets,
    busy,
    message,
    presetName,
    setPresetName,
    ipPrimary,
    setIpPrimary,
    ipSecondary,
    setIpSecondary,
    helperStatus,
    refreshDns,
    savePreset,
    applyServers,
    applyDraftIps,
    clearDns,
    removePreset,
    installHelper,
    uninstallHelper,
  } = useDnsControl()

  return (
    <div className="app">
      <AppHeader />

      <HelperPanel
        busy={busy}
        helperStatus={helperStatus}
        onInstall={installHelper}
        onUninstall={uninstallHelper}
      />

      <StatusBanner message={message} />

      <QuickApplyPanel busy={busy} onApply={applyDraftIps} onClear={clearDns} />

      <PresetsPanel
        busy={busy}
        ipPrimary={ipPrimary}
        ipSecondary={ipSecondary}
        presetName={presetName}
        onIpPrimaryChange={setIpPrimary}
        onIpSecondaryChange={setIpSecondary}
        onPresetNameChange={setPresetName}
        onSavePreset={savePreset}
        presets={presets}
        onApplyServers={applyServers}
        onRemovePreset={removePreset}
      />

      <CurrentDnsPanel dnsByService={dnsByService} busy={busy} onRefresh={refreshDns} />
    </div>
  )
}
