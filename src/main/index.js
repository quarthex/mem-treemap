import { exec } from 'child_process'
import { app, BrowserWindow } from 'electron'
import { totalmem } from 'os'
import path from 'path'
import url from 'url'

let window
let memmap
const TOTALMEM = totalmem() / 1024

function memmapUnix () {
  return new Promise((resolve, reject) => {
    exec('ps -eo pid,ppid,pgrp,rss,command', (error, stdout) => {
      if (error) {
        reject(error)
      } else {
        const seenPids = new Set()
        const data = stdout
          .split('\n')
          .slice(1)
          .map(x =>
            /^\s*([1-9]\d*)\s+([1-9]\d*)\s+([1-9]\d*)\s+([1-9]\d*)\s+(.+)$/.exec(
              x
            )
          )
          .filter(x => x)
          .map(match => {
            const pid = +match[1]
            seenPids.add(pid)
            // The ppid may be 0 for kernel helpers, coerce their parent to 1
            // for simplicity.
            const ppid = +match[2] || 1
            const pgrp = +match[3]
            return {
              pid,
              ppid,
              pgrp,
              mem: +match[4],
              command: match[5],
              shortCommand: match[5]
                ? match[5]
                    .split(' ')[0]
                    .split('/')
                    .pop()
                : ''
            }
          })
        // fixup ppid's of 1 when there's a group id that maps to a currently
        // existing pid.
        for (const proc of data) {
          if (
            proc.ppid === 1 &&
            proc.pgrp &&
            proc.pgrp !== proc.pid &&
            seenPids.has(proc.pgrp)
          ) {
            proc.ppid = proc.pgrp
          }
        }
        resolve(data)
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
    break

  default:
    memmap = () => {
      throw new Error('Not yet implemented')
    }
    break
}

function create () {
  window = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js'),
      enableRemoteModule: false
    }
  })
  window.loadURL(
    url.format({
      pathname: path.resolve(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  )
  const timer = setInterval(() => {
    memmap().then(map => {
      window.webContents.send('data', map, TOTALMEM)
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

app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', event => event.preventDefault())
  contents.on('new-window', event => event.preventDefault())
})
