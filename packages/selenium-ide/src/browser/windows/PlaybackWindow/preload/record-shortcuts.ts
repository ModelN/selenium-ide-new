import Recorder from './recorder'
import { singleton as locatorBuilders } from './locator-builders_custom'

let recorder: Recorder
async function onContextMenu(event: any) {
  const el = event.target as HTMLElement
  var targets:any = locatorBuilders.buildAll(el, false)
  const selectedCommand = await window.sideAPI.menus.openSync('playback')
  if(selectedCommand==='tableRowCriteriaData'){
    targets = locatorBuilders.buildTableRowCriteriaData(el)
  }
  switch (selectedCommand) {
    case 'Record Wait For Element Present':
      recorder.record(
        event,
        'waitForElementPresent',
        targets,
        '',
        false,
        null,
        '',
        '',
        '',
        false
      )
      break
    case 'Record Wait For Element Visible':
      recorder.record(
        event,
        'waitForElementVisible',
        targets,
        '',
        false,
        null,

                '',
                '',
                '',
                false
      )
      break
    case 'Record Wait For Element Text':
      recorder.record(
        event,
        'waitForText',
        targets,
        el.innerText,
        false,
        null,

                '',
                '',
                '',
                false
      )
      break
    case 'Record Wait For Element Editable':
      recorder.record(
        event,
        'waitForElementEditable',
        targets,
        '',
        false,
        null,

                '',
                '',
                '',
                false
      )
      break
      case 'Mouse Over':
      recorder.record(
        event,
        'mouseOver',
        targets,
        '',
        false,
        null,

                '',
                '',
                '',
                false
      )
      break
      case 'JS Click':
      recorder.record(
        event,
        'jsclick',
        targets,
        '',
        false,
        null,

                '',
                '',
                '',
                false
      )
      event.target.click();
      break
      case 'tableRowCriteriaData':
      recorder.record(
        event,
        'tableRowCriteriaData',
        targets,
        '',
        false,
        null,

                '',
                '',
                '',
                false
      )
      break
      case 'readDataFromUI':
        var tagName = event.target.nodeName.toLowerCase();
        let value = event.target.value ? event.target.value :  event.target.textContent;
        //for dropdown, get the label of selected option
        if (tagName == 'select' || tagName == 'option') {
          value = getOptionLocator(event.target.options[event.target.selectedIndex]);
          value = value ? value.split('=')[1] : event.target.value;
        }
      recorder.record(
        event,
        'readDataFromUI',
        targets,
        '',
        false,
        null,

                '',
                '',
                '',
                false
      )
      break
  }
}

export function attach(_recorder: Recorder) {
  recorder = _recorder
  window.addEventListener('contextmenu', onContextMenu)
}
const nbsp = String.fromCharCode(160)
function getOptionLocator(option: HTMLOptionElement) {
  let label = option.text.replace(/^ *(.*?) *$/, '$1')
  if (label.match(new RegExp(nbsp))) {
    // if the text contains &nbsp;
    return (
      'label=mostly-equals:' +
      label
        .replace(/[(\)\[\]\\\^\$\*\+\?\.\|\{\}]/g, (str) => `\\${str}`)
        .replace(/\s/g, ' ')
        .trim()
    )
  } else {
    return 'label=' + label
  }
}
export function detach() {
  window.removeEventListener('contextmenu', onContextMenu)
}
