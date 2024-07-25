import api from 'browser/api'
import { contextBridge, webFrame, ipcRenderer } from 'electron'
import preload from './preload'

export const cb = (isWebdriver: boolean) => () => new Promise<void>((resolve) => {
  /**
   * Binds our API on initialization
   */
  process.once('loaded', async () => {
    /**
     * Expose it in the main context
     */
    webFrame.executeJavaScript(`
      Object.defineProperty(navigator, 'webdriver', {
        get () {
          return ${isWebdriver.toString()}
        } 
      })
    `)
    contextBridge.exposeInMainWorld('sideAPI', window.sideAPI)
    contextBridge.exposeInMainWorld('ws',
    {
      send: (data:any) => ipcRenderer.send('SIDEToScripter',data)
    })
    const preloads = await window.sideAPI.plugins.getPreloads()
    for (const preload of preloads) {
      try {
        eval(preload)
      } catch (e) {
        console.error(`Error loading preload: ${preload}`, e)
      }
    }
    resolve()
  })
});

export default () => preload(api, cb(false))
