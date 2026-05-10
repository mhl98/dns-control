const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('dnsApi', {
  listServices: () => ipcRenderer.invoke('dns:list-services'),
  getAllDns: () => ipcRenderer.invoke('dns:get-all'),
  applyServers: (servers) => ipcRenderer.invoke('dns:apply', servers),
  clearDns: () => ipcRenderer.invoke('dns:clear'),
  getHelperStatus: () => ipcRenderer.invoke('dns:helper-status'),
  installHelper: () => ipcRenderer.invoke('dns:helper-install'),
  uninstallHelper: () => ipcRenderer.invoke('dns:helper-uninstall'),
  loadPresets: () => ipcRenderer.invoke('presets:load'),
  savePresets: (data) => ipcRenderer.invoke('presets:save', data),
})
