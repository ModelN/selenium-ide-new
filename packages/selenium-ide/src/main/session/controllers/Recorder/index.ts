import { CommandShape } from '@seleniumhq/side-model'
import {
  getActiveCommand,
  getActiveCommandIndex,
  getActiveWindowHandleID,
} from '@seleniumhq/side-api/dist/helpers/getActiveData'
import { LocatorFields, RecordNewCommandInput, test } from '@seleniumhq/side-api'
import { randomUUID } from 'crypto'
import { relative } from 'node:path'
import BaseController from '../Base'
import { BrowserWindow, ipcMain } from 'electron'

const uninitializedWindows = ['data:,', 'about:blank']

const makeSelectFrameCMD = (target: string): CommandShape => ({
  command: 'selectFrame',
  id: randomUUID(),
  target,
  value: '',
})

const getFrameTraversalCommands = (
  startingFrame: string,
  endingFrame: string
): CommandShape[] => {
  if (!startingFrame || !endingFrame || startingFrame === endingFrame) {
    return []
  }

  const relativePath = relative(startingFrame, endingFrame)
    .replace(/^.*root/, 'root')
    .split('/')
  const relPathString = relativePath[0]
  switch (relPathString) {
    case '..':
      return [makeSelectFrameCMD('relative=parent')]
    case 'root':
      return [makeSelectFrameCMD('relative=top')]
    default: {
      let frameCommands = []
      const frameTargets = relPathString.split('\\')
      for (let frameTarget of frameTargets) {
        if (frameTarget === '..')
          frameCommands.push(makeSelectFrameCMD('relative=parent'))
        else frameCommands.push(makeSelectFrameCMD(`index=${frameTarget}`))
      }
      return frameCommands
    }
  }
}

const actionCommentMap : any = {
  'click' : 'Click on',
  'type' : 'Entering',
  'select' : 'Selecting',
  'readDataFromUI' : 'Reading',
  'readElementAttribute' : 'Reading Attribute',
  'readElementStyle' : 'Reading Style',
  'readElementPresence' : 'Reading Presence',
  'checkbox': 'Check/Uncheck',
  'performWait' : 'Wait on',
  'dragAndDropToObject' : 'Drag',
  'jsclick' : 'Click on'
}
//@ts-ignore
const actionsReqDetails = ['readElementAttribute', 'readElementStyle', 'performWait', 'ComparisonOfTwoValues'];
//@ts-ignore
const ignoreTableDetailsForActions = ['ComparisonOfTwoValues']
var tableRowCriteriaData:any = undefined;


export default class RecorderController extends BaseController {
  windowIDs: number[] = []

  async recordNewCommand(
    cmd: RecordNewCommandInput,
    overrideRecorder = false
  ): Promise<CommandShape[] | null> {
    const session = await this.session.state.get()
    if (session.state.status !== 'recording' && !overrideRecorder) {
      return null
    }
    const activeWindowHandleID = getActiveWindowHandleID(session) || 'root'
    const commands = []
    if (cmd.winHandleId && activeWindowHandleID != cmd.winHandleId) {
      const selectWindowCommand: CommandShape = {
        id: randomUUID(),
        command: 'selectWindow',
        target: 'handle=${' + cmd.winHandleId + '}',
        value: '',
      }
      commands.push(selectWindowCommand)
    }
    const mainCommand: CommandShape = {
      ...cmd,
      id: randomUUID(),
      target: Array.isArray(cmd.target) ? cmd.target[0][0] : cmd.target,
      targets: Array.isArray(cmd.target) ? cmd.target : [[cmd.target, '']],
      value: Array.isArray(cmd.value) ? cmd.value[0][0] : cmd.value,
    }
    const windows = BrowserWindow.getAllWindows()
    this.windowIDs = windows.map((window) => window.id)
    this.updateCommentInRecordedCommand(cmd.command, cmd.comment, mainCommand)
    if (cmd.recordedType == 'table' && (cmd.command == 'click' || cmd.command == 'jsclick')) {
      var self = this;
      console.log('New window opened, delaying the input request to webapp by 5 seconds');
      //Adding delay before asking for inputs in webapp, as facing recording side issues in newly opened window
      if(cmd.additionalData.requireDelayBeforeRequestToWebapp){
      setTimeout(function() {
        self.updateInputsFromWebappIfAny(cmd, test.commands[commands.length-1]);
      }, 5000);
    }
    else{
        this.updateInputsFromWebappIfAny(cmd, test.commands[commands.length-1]);
    }
  }
    commands.push(
      ...getFrameTraversalCommands(
        session.state.recorder.activeFrame,
        cmd.frameLocation as string
      )
    )
    commands.push(mainCommand)
    return commands
  }

updateCommentInRecordedCommand(command: string, comment: string | undefined, recCommand: CommandShape) {
    if (comment && recCommand) {
      recCommand.comment = (actionCommentMap[command] ? actionCommentMap[command] : command) + ' ' + comment.replace(':', '');
    }
  }

  async requestHighlightElement(fieldName: LocatorFields) {
    const activeCommand = getActiveCommand(await this.session.state.get())
    this.session.api.recorder.onHighlightElement.dispatchEvent(
      activeCommand[fieldName] as string
    )
  }

  async requestSelectElement(activate: boolean, fieldName: LocatorFields) {
    this.session.windows.getActivePlaybackWindow()?.focus()
    this.session.api.recorder.onRequestSelectElement.dispatchEvent(
      activate,
      fieldName
    )
  }

  async requestElementAt(x: number, y: number) {
    const results =
      await this.session.api.recorder.onRequestElementAt.dispatchEventAsync(
        x,
        y
      )
    const allResults = results.flat().flat().filter(Boolean)
    return allResults
  }

  async getWinHandleId(): Promise<string> {
    const session = await this.session.state.get()
    return getActiveWindowHandleID(session) || 'root'
  }

  updateInputsFromWebappIfAny(message: RecordNewCommandInput, recCommand:CommandShape) {
    var self = this;
    // var isUserClicksOnCancel = function(response:any) {
    //   if (response.data.removeLastCommand) {
    //     //Remove last recorded command && resume recording
    //     //UiState.displayedTest.removeCommand(recCommand)
    //     self.session.api.recorder.start();
    //     return true;
    //   }
    //   return false;
    // }
    var getResponseFromWebApp = function() {
      if (actionsReqDetails.indexOf(message.command) > -1) {
        self.session.api.recorder.stop();
        var dataInputToWebapp = {modalType: message.command, data: { comment : message.comment}};
        // var callbackFn = function(response:any) {
        //   // if (isUserClicksOnCancel(response)) {
        //   //   return;
        //   // }
        //   recCommand.otherData = response.data;
        //   if (ignoreTableDetailsForActions.indexOf(message.command) > -1 && message.recordedType == 'table') {
        //     var newTarget = message.target && message.target[1] ? message.target[1][0] : message.target[0][0];
        //     recCommand.target = newTarget;
        //   }
        //   self.session.api.recorder.start();
        // }
        self.updateDataFromWebAppInRecCommand(dataInputToWebapp, true);
      } else
      self.session.api.recorder.start();
    }
    if (message.recordedType) {
      if (message.recordedType == 'table' && ignoreTableDetailsForActions.indexOf(message.command) == -1) {
        var rowType = message.additionalData.rowType;
        var elementType = message.additionalData.elementType;
        var columnName = message.additionalData.columnName;
        var columnType = message.additionalData.columnType;
        var altId = message.additionalData.altId ? message.additionalData.altId : '';
        var elementIndex = message.additionalData.elementIndex ? message.additionalData.elementIndex : '1';
        /*browser.windows.update(this.windowSession.ideWindowId, { focused: true })
            .then(() => {setTimeout(() => {
                recCommand.setHasTableInput(true);
                recCommand.setTableInput({'SelectRow': {'rowType' : rowType}, 'SelectColumn': {'elementType' : elementType}});
                ModalState.toggleTableInputConfig();
                recCommand.toggleOpensTableInput();
              }, 100)});*/
        var newTableData:any = [{SelectRow: [{rowType : rowType}], SelectColumn: [{altId: altId, elementType : elementType, columnType : columnType, columnName : columnName, elementIndex : elementIndex}]}]
        var uniqColName = columnName && columnName.length > 2 ? columnName : undefined;
        if (tableRowCriteriaData && tableRowCriteriaData.length > 0) {
          newTableData[0].SelectRow[0]['ColumnIdentifier'] = JSON.parse(JSON.stringify(tableRowCriteriaData));
          if (!uniqColName) {
            for (var idx in tableRowCriteriaData) {
              var colIdData = tableRowCriteriaData[idx]
              if (colIdData.columnName != undefined && colIdData.columnName != '' && colIdData.columnName.length > 2) {
                uniqColName = colIdData.columnName
                break
              }
            }
          }
          tableRowCriteriaData = undefined;
        }
        newTableData[0].columnName = uniqColName;
        if(message.additionalData.advancesSearchFormContainer) {
          newTableData[0].advancesSearchFormContainer = message.additionalData.advancesSearchFormContainer;
        }if(message.additionalData.isChildRow) {
          newTableData[0].SelectRow[0]['isChildRow'] = message.additionalData.isChildRow;
        }
        /*if (tableData) {
          newTableData = JSON.parse(JSON.stringify(tableData))
          newTableData[0].SelectRow[0].rowType = rowType
          newTableData[0].SelectColumn[0].elementType = elementType
        }*/
        var selectTableData = {modalType: 'SelectTable', data: newTableData};
        // var callbackFn = function(response:any) {
        //   //If user click on cancel in table view
        //   // if (isUserClicksOnCancel(response)) {
        //   //   return;
        //   // }
        //   recCommand.otherData = response.data;
        //   //tableData = response.data
        //   var newComm = ''
        //   if (response.data[0] && response.data[0].SelectColumn && response.data[0].SelectColumn[0] && response.data[0].SelectColumn[0]) {
        //     var colData = response.data[0].SelectColumn[0];
        //     newComm = (colData.columnName && colData.columnName != '' ? colData.columnName : (colData.columnType && colData.columnType != '' ? colData.columnType : ''))
        //   }
        //   if (newComm != '') {
        //     newComm = (message.comment ? message.comment + ' in ' + newComm + ' column' : newComm + ' column')
        //     self.updateCommentInRecordedCommand(message.command, newComm, recCommand);
        //   }
        //   getResponseFromWebApp();
        // }
        self.session.api.recorder.stop();
        this.updateDataFromWebAppInRecCommand(selectTableData, actionsReqDetails.indexOf(message.command) > -1);
      } else if (message.recordedType == 'leftNav' || message.recordedType == 'locatorHavingData') {
        this.setAdditionalData(message, recCommand);
      }
    }
    if (message.recordedType != 'table' || ignoreTableDetailsForActions.indexOf(message.command) > -1) {
      tableRowCriteriaData = undefined;
      getResponseFromWebApp();
    }
  }

  setAdditionalData(message1:RecordNewCommandInput, recCommand1:CommandShape) {
    if (message1.additionalData) {
      var otherData = recCommand1.otherData;
      if (!otherData) otherData = {};
      if (message1.command == 'dragAndDropToObject' && message1.additionalData.toElementTargets) {
        otherData.toElementTargets = message1.additionalData.toElementTargets;
      } else if (message1.recordedType == 'leftNav' || message1.recordedType == 'locatorHavingData') {
        recCommand1.otherData = {'isLeftNav': 'true'};
        if (message1.recordedType == 'leftNav')
          otherData.navLinks = message1.additionalData.navLinks;
        else
          otherData.innerText = message1.additionalData.innerText;
      }
      recCommand1.otherData = otherData;
    }
  };

  updateDataFromWebAppInRecCommand(data:any,  noToggling:boolean) {    
    if (!noToggling)
      this.session.api.recorder.stop();
    ipcMain.emit('SIDEToScripter', JSON.stringify({type: 'showModal', payload: data}))
    // browser.runtime.sendMessage({type: 'showModal', payload: data}).then(function(response:any) {
      //  callbackFn();
    //   if (!noToggling)
    //     window.sideAPI.recorder.start();
    // });
  }

  async getFrameLocation(event: Electron.IpcMainEvent): Promise<string> {
    let frameLocation = 'root'
    let activeFrame = event.senderFrame
    let pathParts = []
    while (activeFrame.parent) {
      const frameIndex = activeFrame.parent.frames.indexOf(activeFrame)
      pathParts.push(frameIndex)
      activeFrame = activeFrame.parent
    }
    pathParts.push(frameLocation)
    frameLocation = pathParts.reverse().join('/')
    return frameLocation
  }

  /**
   * Returns a string correlating to the window handle of the window that was opened.
   * If the window was opened by a command, the handle will be the name of the window.
   */
  async start(): Promise<string> {
    const playback = await this.session.playback.getPlayback(
      this.session.state.state.activeTestID
    )
    const executor = playback.executor
    const driver = executor.driver
    const useBidi = this.session.store.get('browserInfo.useBidi')
    const newStepID = randomUUID()
    if (useBidi) {
      const firstWindowURL = await driver.getCurrentUrl()
      if (uninitializedWindows.includes(firstWindowURL)) {
        await executor.doOpen(this.session.projects.project.url)
      }
      return newStepID
    }

    let playbackWindow = await this.session.windows.getActivePlaybackWindow()
    if (playbackWindow) {
      playbackWindow.focus()
      this.session.api.recorder.onStartRec.dispatchEvent('');
      return newStepID
    }

    const state = await this.session.state.get()
    const activeCommand = getActiveCommand(state)
    const activeCommandIndex = getActiveCommandIndex(state)
    if (activeCommandIndex > 0) {
      await this.session.playback.play(state.state.activeTestID, [
        0,
        activeCommandIndex,
      ])
      await this.session.playback.stop()
      await this.session.api.state.setActiveCommand(activeCommand.id)
      return newStepID
    }
    // Needs to open a URL, if on an open command, just use that
    // Otherwise add an open command to the record commands
    const currentCommand = getActiveCommand(state)
    if (currentCommand.command !== 'open') {
      playback.executor.doOpen(state.project.url)
      return newStepID
    }
    const url = new URL(currentCommand.target as string, state.project.url)
    playback.executor.doOpen(url.toString())    
    return newStepID
  }
  async stop(): Promise<string | null> {
    await this.session.windows.getActivePlaybackWindow()    
    this.session.api.recorder.onStopRec.dispatchEvent('');
    return null;
  }
}
