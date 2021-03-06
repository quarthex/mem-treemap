import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mem-treemap', callback => {
  ipcRenderer.on('data', (_, map, total) => callback(map, total))
})
