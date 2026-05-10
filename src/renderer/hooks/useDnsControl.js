import { useCallback, useEffect, useState } from 'react'
import { createPresetId } from '../utils/createId.js'
import { serversFromIpInputs } from '../utils/serversFromInputs.js'

const DEFAULT_IP_PRIMARY = '8.8.8.8'
const DEFAULT_IP_SECONDARY = '8.8.4.4'

function toErrorMessage(err) {
  if (typeof err === 'string') return err
  if (err && typeof err.message === 'string') return err.message
  return String(err)
}

function getApi() {
  return typeof window !== 'undefined' ? window.dnsApi : undefined
}

export function useDnsControl() {
  const api = getApi()

  const [dnsByService, setDnsByService] = useState({})
  const [presets, setPresets] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [presetName, setPresetName] = useState('')
  const [ipPrimary, setIpPrimary] = useState(DEFAULT_IP_PRIMARY)
  const [ipSecondary, setIpSecondary] = useState(DEFAULT_IP_SECONDARY)
  const [helperStatus, setHelperStatus] = useState(null)

  const clearBanner = useCallback(() => setMessage(null), [])

  const showError = useCallback((err) => {
    setMessage({ type: 'error', text: toErrorMessage(err) })
  }, [])

  const showOk = useCallback((text) => {
    setMessage({ type: 'ok', text })
  }, [])

  const refreshHelperStatus = useCallback(async () => {
    if (!api?.getHelperStatus) return
    const res = await api.getHelperStatus()
    if (res.ok) {
      setHelperStatus({
        installed: res.installed,
        passwordless: res.passwordless,
        installPath: res.installPath,
      })
    } else {
      setHelperStatus(null)
    }
  }, [api])

  const refreshDns = useCallback(async () => {
    if (!api?.getAllDns) return
    clearBanner()
    const res = await api.getAllDns()
    if (res.ok) {
      setDnsByService(res.dnsByService ?? {})
    } else {
      showError(res.error)
    }
  }, [api, clearBanner, showError])

  const loadPresets = useCallback(async () => {
    if (!api?.loadPresets) return
    const res = await api.loadPresets()
    if (res.ok && res.data?.presets) {
      setPresets(res.data.presets)
    }
  }, [api])

  useEffect(() => {
    refreshDns()
    loadPresets()
    refreshHelperStatus()
  }, [refreshDns, loadPresets, refreshHelperStatus])

  const persistPresets = useCallback(
    async (next) => {
      if (!api?.savePresets) return false
      const res = await api.savePresets({ presets: next })
      if (!res.ok) {
        showError(res.error)
        return false
      }
      setPresets(next)
      return true
    },
    [api, showError],
  )

  const savePreset = useCallback(async () => {
    const name = presetName.trim()
    const servers = serversFromIpInputs(ipPrimary, ipSecondary)
    if (!name) {
      showError('Enter a preset name.')
      return
    }
    if (servers.length === 0) {
      showError('Enter at least one DNS IPv4 address.')
      return
    }
    const next = [...presets, { id: createPresetId(), name, servers }]
    const ok = await persistPresets(next)
    if (ok) {
      showOk(`Saved “${name}”.`)
    }
  }, [presetName, ipPrimary, ipSecondary, presets, persistPresets, showError, showOk])

  const applyServers = useCallback(
    async (servers) => {
      if (!api?.applyServers) return
      setBusy(true)
      clearBanner()
      try {
        const res = await api.applyServers(servers)
        if (res.ok) {
          const text = res.usedHelper
            ? 'DNS updated (no password — helper is installed).'
            : 'DNS updated. If the helper is not installed, you entered your Mac password when macOS asked.'
          showOk(text)
          await refreshDns()
        } else {
          showError(res.error)
        }
      } catch (e) {
        showError(e)
      } finally {
        setBusy(false)
      }
    },
    [api, clearBanner, refreshDns, showError, showOk],
  )

  const clearDns = useCallback(async () => {
    if (!api?.clearDns) return
    setBusy(true)
    clearBanner()
    try {
      const res = await api.clearDns()
      if (res.ok) {
        const text = res.usedHelper
          ? 'DNS cleared on all services (no password — helper is installed).'
          : 'DNS cleared on all services. If the helper is not installed, you confirmed with your Mac password when asked.'
        showOk(text)
        await refreshDns()
      } else {
        showError(res.error)
      }
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }, [api, clearBanner, refreshDns, showError, showOk])

  const removePreset = useCallback(
    async (id) => {
      const next = presets.filter((p) => p.id !== id)
      await persistPresets(next)
    },
    [presets, persistPresets],
  )

  const applyDraftIps = useCallback(() => {
    applyServers(serversFromIpInputs(ipPrimary, ipSecondary))
  }, [applyServers, ipPrimary, ipSecondary])

  const installHelper = useCallback(async () => {
    if (!api?.installHelper) return
    setBusy(true)
    clearBanner()
    try {
      const res = await api.installHelper()
      if (res.ok) {
        await refreshHelperStatus()
        showOk(
          res.passwordless
            ? 'Helper installed. Future Apply/Clear should not ask for your password.'
            : 'Helper installed, but passwordless sudo was not detected. Try Apply again or check sudoers.',
        )
      } else {
        showError(res.error)
      }
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }, [api, clearBanner, refreshHelperStatus, showError, showOk])

  const uninstallHelper = useCallback(async () => {
    if (!api?.uninstallHelper) return
    setBusy(true)
    clearBanner()
    try {
      const res = await api.uninstallHelper()
      if (res.ok) {
        await refreshHelperStatus()
        showOk('Helper removed. Apply/Clear will use a password prompt again.')
      } else {
        showError(res.error)
      }
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }, [api, clearBanner, refreshHelperStatus, showError, showOk])

  return {
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
  }
}
