import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import os from 'node:os'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Fixed install path — must match sudoers rule from install-helper. */
const HELPER_INSTALL_PATH = '/usr/local/libexec/dns-control-helper.sh'
const SUDOERS_PATH = '/etc/sudoers.d/dns-control'

const IPv4_RE = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

function validateIps(ips) {
  if (!Array.isArray(ips) || ips.length === 0) return 'At least one DNS IP is required.'
  for (const ip of ips) {
    if (typeof ip !== 'string' || !IPv4_RE.test(ip.trim())) {
      return `Invalid IPv4 address: ${ip}`
    }
  }
  return null
}

function presetsPath() {
  const dir = app.getPath('userData')
  mkdirSync(dir, { recursive: true })
  return path.join(dir, 'presets.json')
}

function loadPresetsFromDisk() {
  const p = presetsPath()
  if (!existsSync(p)) return { presets: [] }
  try {
    const data = JSON.parse(readFileSync(p, 'utf8'))
    if (data && Array.isArray(data.presets)) return data
  } catch {
    /* ignore */
  }
  return { presets: [] }
}

function savePresetsToDisk(data) {
  writeFileSync(presetsPath(), JSON.stringify(data, null, 2), 'utf8')
}

function getBundledHelperPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'dns-control-helper.sh')
  }
  return path.join(__dirname, '..', 'scripts', 'dns-control-helper.sh')
}

async function listNetworkServices() {
  const { stdout } = await execFileAsync('networksetup', ['-listallnetworkservices'])
  return stdout
    .trim()
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('*'))
}

async function getDnsForService(service) {
  const { stdout } = await execFileAsync('networksetup', ['-getdnsservers', service])
  const t = stdout.trim()
  if (!t || t.startsWith("There aren't any DNS Servers set on")) return []
  return t.split('\n').map((s) => s.trim()).filter(Boolean)
}

function bashQuoteSingle(s) {
  return `'${s.replace(/'/g, `'\\''`)}'`
}

/**
 * Run a bash script with administrator privileges (macOS password dialog).
 */
function runBashAsAdmin(scriptBody) {
  const scriptPath = path.join(tmpdir(), `dns-control-${randomUUID()}.sh`)
  const fullScript = `#!/bin/bash
set -euo pipefail
${scriptBody}
`
  writeFileSync(scriptPath, fullScript, { mode: 0o700 })
  const asPath = scriptPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  return new Promise((resolve, reject) => {
    execFile(
      'osascript',
      [
        '-e',
        `do shell script "bash " & quoted form of "${asPath}" with administrator privileges`,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        try {
          unlinkSync(scriptPath)
        } catch {
          /* noop */
        }
        if (err) {
          const msg = stderr?.toString() || err.message || String(err)
          reject(new Error(msg))
        } else {
          resolve(stdout?.toString() ?? '')
        }
      },
    )
  })
}

function runFileAsAdmin(scriptPathOnDisk) {
  const abs = path.resolve(scriptPathOnDisk)
  const asPath = abs.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return new Promise((resolve, reject) => {
    execFile(
      'osascript',
      ['-e', `do shell script "bash " & quoted form of "${asPath}" with administrator privileges`],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const msg = stderr?.toString() || err.message || String(err)
          reject(new Error(msg))
        } else {
          resolve(stdout?.toString() ?? '')
        }
      },
    )
  })
}

async function tryHelperNoPassword(mode, servers) {
  if (!existsSync(HELPER_INSTALL_PATH)) return false
  const args =
    mode === 'clear'
      ? ['-n', HELPER_INSTALL_PATH, 'clear']
      : ['-n', HELPER_INSTALL_PATH, 'apply', ...servers.map((s) => s.trim())]
  try {
    await execFileAsync('sudo', args, { maxBuffer: 10 * 1024 * 1024 })
    return true
  } catch {
    return false
  }
}

/** Returns true if `sudo -n` can run the helper’s test subcommand (NOPASSWD rule). */
async function helperPasswordlessWorks() {
  if (!existsSync(HELPER_INSTALL_PATH)) return false
  try {
    await execFileAsync('sudo', ['-n', HELPER_INSTALL_PATH, 'test'], {
      maxBuffer: 1024 * 1024,
    })
    return true
  } catch {
    return false
  }
}

function buildSetDnsScript(servers) {
  const ips = servers.map((s) => bashQuoteSingle(s.trim())).join(' ')
  return `
while IFS= read -r SERVICE; do
  [[ -z "$SERVICE" ]] && continue
  [[ "$SERVICE" == \\** ]] && continue
  networksetup -setdnsservers "$SERVICE" ${ips}
done < <(networksetup -listallnetworkservices | sed '1d')
`
}

function buildClearDnsScript() {
  return `
while IFS= read -r SERVICE; do
  [[ -z "$SERVICE" ]] && continue
  [[ "$SERVICE" == \\** ]] && continue
  networksetup -setdnsservers "$SERVICE" empty
done < <(networksetup -listallnetworkservices | sed '1d')
`
}

async function runDnsApply(servers) {
  if (await tryHelperNoPassword('apply', servers)) return { usedHelper: true }
  await runBashAsAdmin(buildSetDnsScript(servers))
  return { usedHelper: false }
}

async function runDnsClear() {
  if (await tryHelperNoPassword('clear', [])) return { usedHelper: true }
  await runBashAsAdmin(buildClearDnsScript())
  return { usedHelper: false }
}

async function installPrivilegedHelper() {
  const src = getBundledHelperPath()
  if (!existsSync(src)) {
    throw new Error(
      'Bundled dns-control-helper.sh not found. Reinstall the app or run from the project with scripts/ present.',
    )
  }
  const user = os.userInfo().username
  const line = `${user} ALL=(root) NOPASSWD: ${HELPER_INSTALL_PATH}`
  const installScript = path.join(tmpdir(), `dns-control-install-${randomUUID()}.sh`)
  const body = `#!/bin/bash
set -euo pipefail
install -d /usr/local/libexec
install -m 0555 ${JSON.stringify(src)} ${JSON.stringify(HELPER_INSTALL_PATH)}
printf '%s\\n' ${JSON.stringify(line)} > ${JSON.stringify(SUDOERS_PATH)}
chmod 0440 ${JSON.stringify(SUDOERS_PATH)}
chown root:wheel ${JSON.stringify(SUDOERS_PATH)}
`
  writeFileSync(installScript, body, { mode: 0o700 })
  try {
    await runFileAsAdmin(installScript)
  } finally {
    try {
      unlinkSync(installScript)
    } catch {
      /* noop */
    }
  }
}

async function uninstallPrivilegedHelper() {
  const p = path.join(tmpdir(), `dns-control-uninstall-${randomUUID()}.sh`)
  writeFileSync(p, `#!/bin/bash\nset -euo pipefail\nrm -f ${JSON.stringify(HELPER_INSTALL_PATH)}\nrm -f ${JSON.stringify(SUDOERS_PATH)}\n`, {
    mode: 0o700,
  })
  try {
    await runFileAsAdmin(p)
  } finally {
    try {
      unlinkSync(p)
    } catch {
      /* noop */
    }
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 720,
    minWidth: 440,
    minHeight: 520,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('dns:list-services', async () => {
    try {
      const services = await listNetworkServices()
      return { ok: true, services }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('dns:get-all', async () => {
    try {
      const services = await listNetworkServices()
      const map = {}
      for (const s of services) {
        try {
          map[s] = await getDnsForService(s)
        } catch {
          map[s] = []
        }
      }
      return { ok: true, dnsByService: map }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('dns:apply', async (_event, servers) => {
    const err = validateIps(servers)
    if (err) return { ok: false, error: err }
    try {
      const { usedHelper } = await runDnsApply(servers)
      return { ok: true, usedHelper }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('dns:clear', async () => {
    try {
      const { usedHelper } = await runDnsClear()
      return { ok: true, usedHelper }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('dns:helper-status', async () => {
    try {
      const installed = existsSync(HELPER_INSTALL_PATH)
      const passwordless = installed && (await helperPasswordlessWorks())
      return { ok: true, installed, passwordless, installPath: HELPER_INSTALL_PATH }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('dns:helper-install', async () => {
    try {
      await installPrivilegedHelper()
      const passwordless = await helperPasswordlessWorks()
      return { ok: true, passwordless }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('dns:helper-uninstall', async () => {
    try {
      await uninstallPrivilegedHelper()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('presets:load', async () => {
    try {
      return { ok: true, data: loadPresetsFromDisk() }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  ipcMain.handle('presets:save', async (_event, data) => {
    try {
      if (!data || !Array.isArray(data.presets)) {
        return { ok: false, error: 'Invalid presets payload' }
      }
      for (const p of data.presets) {
        if (!p.name || !Array.isArray(p.servers)) {
          return { ok: false, error: 'Each preset needs name and servers[]' }
        }
        const ve = validateIps(p.servers)
        if (ve) return { ok: false, error: `${p.name}: ${ve}` }
      }
      savePresetsToDisk(data)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
