import { readFile } from 'fs'
import path from 'path'
import url from 'url'
import { app, BrowserWindow } from 'electron'
import { exec } from 'child_process'

let window
let memmap
let total = 0

function memmapUnix () {
  return new Promise((resolve, reject) => {
    exec('ps -eo pid,rss,command', (error, stdout) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout.split('\n').slice(1)
          .map(x => /^\s*([1-9][0-9]*)\s+([1-9][0-9]*)\s+(.+)$/.exec(x))
          .filter(x => x)
          .map(match => ({
            pid: +match[1],
            mem: +match[2],
            command: match[3]
          }))
        )
      }
    })
  })
}

switch (process.platform) {
  case 'darwin':
    memmap = memmapUnix
    break

  case 'linux':
    memmap = memmapUnix
    readFile('/proc/meminfo', (err, data) => {
      if (err) throw err
      total = +/MemTotal:\s+(\d+) kB/.exec(data)[1]
    })
    break

  default:
    memmap = () => { throw new Error('Not yet implemented') }
    break
}

function create () {
  window = new BrowserWindow()
  window.loadURL(url.format({
    pathname: path.resolve(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
  const timer = setInterval(() => {
    memmap().then(map => {
      window.webContents.send('data', map, total)
    })
  }, 1000)
  window.on('close', () => {
    clearInterval(timer)
    window = null
  })
}

app.on('ready', create)

if (process.platform !== 'darwin') {
  app.on('window-all-closed', app.quit)
}

app.on('activate', () => {
  if (window === null) {
    create()
  }
})
