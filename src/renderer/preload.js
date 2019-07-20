import { ipcRenderer, webFrame } from 'electron'
import { EventEmitter } from 'events'

webFrame.executeJavaScript('window', win => {
  win.dataSource = new EventEmitter()

  ipcRenderer.on('data', (_, map, total) => {
    win.dataSource.emit('data', map, total)
  })
})
