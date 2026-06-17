import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openWin: (url: string) => ipcRenderer.invoke('open-win', url),
  exportBill: (data: { fileName: string; content: string }) =>
    ipcRenderer.invoke('export-bill', data)
})
