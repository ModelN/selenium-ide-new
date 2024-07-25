import 'v8-compile-cache'
import 'source-map-support/register'
import { app , ipcMain} from 'electron'
import { autoUpdater } from 'electron-updater'
import { configureLogging, connectSessionLogging } from './log'
import createSession from './session'
import installReactDevtools from './install-react-devtools'
import { isAutomated } from './util'
import http from "http"
import * as WebSocket from "ws"


let wsGlobal : any = undefined;
let requestedData:boolean = false;
// @ts-ignore
function handleMessageFromSIDE(message : any) {
  message = JSON.parse(message);
  switch(message.type) {
    case "bglog":
      console.log(message.payload);
      if (wsGlobal)
        wsGlobal.send(JSON.stringify({type: 'log', payload: message.payload}));
      break;
    case "data":
      // alert('received signal to send data, sending :' + message.paylo)
      if (wsGlobal) {
        wsGlobal.send(JSON.stringify({type: 'data', payload: message.payload}));
        // focusSourceTab();
        wsGlobal.disconnect();
        wsGlobal = undefined;
      }
      break;
    case "showModal":
      if (wsGlobal) {
        requestedData = true;
        wsGlobal.send({type: 'showModal', payload: message.payload});
        // focusSourceTab();
        // var modalHandler = function(request) {
        //   if (request.type == 'requestedData' ) {
        //     console.log('ModalData From WebApp: ' + JSON.stringify(request.payload));
        //     sendResponse({data: request.payload});
        //     tabPort.onMessage.removeListener(modalHandler);
        //   }
        // }
        // tabPort.onMessage.addListener(modalHandler);
      }
      break;
    // case "geturl":
    //   sendResponse({url: url})
    //   break;
    // case "getAppType":
    //   sendResponse({appType: appType})
    //   break;
  }
  // return true;
};


async function startServer(session:any){
const port = 4444;
const server = http.createServer();
const wss = new WebSocket.Server({ server });


wss.on("connection", (ws: WebSocket) => {
  console.error("Connection received...");
  console.log("Connection received...");
  // if (wsGlobal) {
  //   wsGlobal.disconnect();
  // }
  wsGlobal = ws;
    ws.on("message", async (message: string) => {
    console.log("Received the message::" + message);
    //log the received message and send it back to the client
    let msgObj : any;
    try
    {
      msgObj = JSON.parse(message);
    }
    catch(e)
    {
      msgObj = message;
    }
    if (msgObj.type == 'START_RECORDING')
    {
        console.log('Browser tag requested to start recording...');
        console.log('msgObj::' + JSON.stringify(msgObj));        
        var res = session.projects.getActive();
        res.url = msgObj.data.url;
        res.urls = [msgObj.data.url];
        res.appType = msgObj.data.appType;        
        session.state.activeTestID = res.tests[0].id; 
        session.state.state.activeTestID = res.tests[0].id;  
        session.api.state.setActiveTest(res.tests[0].id)                    
        await session.api.recorder.start();      
    }
    else if (msgObj.type == 'requestedData' && requestedData)
    {
      requestedData = false;
      console.log('ModalData From WebApp: ' + JSON.stringify(msgObj.payload));
      // sendResponse({data: request.payload});
      // tabPort.onMessage.removeListener(modalHandler);
    }
    else
    {
      console.log("received: %s", message);
      ws.send(`Message -> ${message}`);
    }

  });
  
  ipcMain.on('SIDEToScripter', (event, msg) => {
    handleMessageFromSIDE(msg);
    event.returnValue = true;
  })
  //send immediatly a feedback to the incoming connection
  ws.send("Hi there, I am a WebSocket server");
});

//start our server
server.listen(port, () => {
  console.log(`Data stream server started on port ${port}`);
});

}


// whatever
app.commandLine.appendSwitch('remote-debugging-port', '8315')
if (isAutomated) {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('no-sandbox');
}
// Configure logging
const log = configureLogging()
autoUpdater.logger = log

// Capture and show unhandled exceptions
process.on('unhandledRejection', function handleWarning(reason) {
  console.log('[PROCESS] Unhandled Promise Rejection')
  console.log('- - - - - - - - - - - - - - - - - - -')
  console.log(reason)
  console.log('- -')
})

process.on('uncaughtException', (error) => {
  console.error('Unhandled Error', error)
})

// Start and stop hooks
app.on('ready', async () => {
  if (!app.isPackaged && !isAutomated) {
    installReactDevtools()
  }
  const session = await createSession(app)
  connectSessionLogging(session)  
  await session.system.startup();  
  await session.api.projects.new();  
  await startServer(session);



  process.on('SIGINT', () => app.quit())
  app.on('open-file', async (_e, path) => {
    // Instantiate the session
    await session.projects.load(path)
  })

  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  let allWindowsClosed = false

  app.on('activate', async () => {
    if (allWindowsClosed) {
      allWindowsClosed = false
      await session.system.startup()
    }
  })

  app.on('before-quit', async (e) => {
    e.preventDefault()
    const successfulExit = await session.system.beforeQuit()
    if (successfulExit) {
      app.exit(0)
    }
  })

  app.on('window-all-closed', async () => {
    allWindowsClosed = true
    if (process.platform === 'darwin') {
      await session.system.shutdown()
    } else {
      await session.system.quit()
    }
  })

  app.on(
    'certificate-error',
    (event, _webContents, _url, _error, _certificate, callback) => {
      session.state.getUserPrefs().then((userPrefs) => {
        console.log(userPrefs)
        if (
          userPrefs.ignoreCertificateErrorsPref === 'Yes' &&
          _url.startsWith(session.projects.project.url)
        ) {
          event.preventDefault()
          callback(true)
        } else callback(false)
      })
    }
  )
})
