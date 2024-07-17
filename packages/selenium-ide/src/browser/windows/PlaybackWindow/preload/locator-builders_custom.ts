/*
 * Copyright 2005 Shinya Kasatani
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { parse_locator } from './utils'
import finder from '@medv/finder'

const findElement = require('./third-party/find-element')

type LocatorFunction = (e: HTMLElement, ctx?: any) => string | null

export default class LocatorBuilders {
  constructor(window: Window) {
    this.window = window
  }
  window: Window
  detach() {}
  static order: string[] = []
  static displayName: string = ''
  static recordedType: string = ''

  static additionalData: any = new Map<string, string>()
  static finderNamesToAddLocatorEvenIfElNotMatched: string[] = []
  static PREFERRED_ATTRIBUTES: string[] = []
  static builderMap: Record<string, LocatorFunction> = {}
  static _preferredOrder: string[] = []

  buildWith(name: string, e: HTMLElement, opt_contextNode?: any) {
    return LocatorBuilders.builderMap[name].call(this, e, opt_contextNode)
  }

  elementEquals(_name: string, e: HTMLElement, locator: string) {
    let fe = LocatorBuilders.findElement(locator)
    //TODO: add match function to the ui locator builder, note the inverted parameters
    return (
      e == fe
      // || (LocatorBuilders.builderMap[name] &&
      //   LocatorBuilders.builderMap[name].match &&
      //   LocatorBuilders.builderMap[name].match(e, fe))
    )
  }

  build(e: HTMLElement) {
    let locators = this.buildAll(e, false)
    if (locators.length > 0) {
      return locators[0][0]
    } else {
      return 'LOCATOR_DETECTION_FAILED'
    }
  }

  buildAll(el: HTMLElement, ignoreInnerText: any): [string, string][] {
    console.log('order:' + LocatorBuilders.order);
    console.log(LocatorBuilders.order);
    LocatorBuilders.recordedType = '';
    LocatorBuilders.additionalData = new Map<string, string>();
    let e = el;
    if (!this.isElementEligibleForRecording(e))
    return [];
    try {
      LocatorBuilders.displayName = LocatorBuilders.getDisplayName(e, ignoreInnerText);
    } catch (ex) {
      console.error('Exception while getting display name ' + ex);
      LocatorBuilders.displayName = '';
    }
    let locator
    let locators: [string, string][] = []
    for (let i = 0; i < LocatorBuilders.order.length; i++) {
      let finderName = LocatorBuilders.order[i]
      try {
        console.log('finderName:' + finderName);
        locator = this.buildWith(finderName, el)
        if (locator) {
          locator = String(locator)
          //Samit: The following is a quickfix for above commented code to stop exceptions on almost every locator builder
          //TODO: the builderName should NOT be used as a strategy name, create a feature to allow locatorBuilders to specify this kind of behaviour
          //TODO: Useful if a builder wants to capture a different element like a parent. Use the this.elementEquals
          let fe = LocatorBuilders.findElement(locator)
          var isElementMatchedWithBuiltLocator = this.isElementFoundByLocatorNotMatchedEligibleForRecording(e, fe);
          if (LocatorBuilders.finderNamesToAddLocatorEvenIfElNotMatched.includes(finderName) || finderName == 'table' || isElementMatchedWithBuiltLocator) {
            locators.push([locator, finderName])
          }
        }
      } catch (e) {
        // TODO ignore the buggy locator builder for now
        //this.log.debug("locator exception: " + e);
      }
    }
    return locators
  }

  buildTableRowCriteriaDataFn(_e: any) {
    return;
  }
  isElementEligibleForRecordingCustomFn(_e: any) {
    return true;
  }
  isElementFoundByLocatorNotMatchedEligibleForRecordingFn(origEl: any, newlyFoundEl: any) {
    return (origEl == newlyFoundEl);
  }
  
  buildTableRowCriteriaData = this.buildTableRowCriteriaDataFn;
  isElementEligibleForRecording = this.isElementEligibleForRecordingCustomFn;
  isElementFoundByLocatorNotMatchedEligibleForRecording = this.isElementFoundByLocatorNotMatchedEligibleForRecordingFn;
  
  getDisplayNameFn = LocatorBuilders.getDisplayName;
  
  cleanup() {
    console.log('inside cleanup')
    LocatorBuilders.order = [];
    LocatorBuilders.builderMap = {};
    LocatorBuilders._preferredOrder = [];
    LocatorBuilders.finderNamesToAddLocatorEvenIfElNotMatched = [];
    LocatorBuilders.PREFERRED_ATTRIBUTES = [
      'id',
      'name',
      'value',
      'type',
      'action',
      'onclick'
    ];
    LocatorBuilders.getDisplayName = this.getDisplayNameFn;
    this.buildTableRowCriteriaData = this.buildTableRowCriteriaDataFn;
    this.isElementEligibleForRecording = this.isElementEligibleForRecordingCustomFn;
    this.isElementFoundByLocatorNotMatchedEligibleForRecording = this.isElementFoundByLocatorNotMatchedEligibleForRecordingFn;
  };
  
  finderNamesToAddLocatorEvenIfElNotMatched = [];
  PREFERRED_ATTRIBUTES = [
    'id',
    'name',
    'value',
    'type',
    'action',
    'onclick'
  ]

  static getDisplayName(e: any, ignoreInnerText: boolean) {
    if (e.innerText && ignoreInnerText != true) {
      var innerText = LocatorBuilders.getInnerTextWithoutChildren(e);
      if (innerText.length > 1)
        return innerText;
    }
    //Ignore title attribute on input/select/textarea fields
    var inputTags = ['input', 'select', 'textarea'];
    if (inputTags.indexOf(e.tagName.toLowerCase()) == -1 && e.getAttribute('title')) {
      return e.getAttribute('title').trim();
    }
    if (e.getAttribute('placeholder')) {
      return e.getAttribute('placeholder').trim();
    }
    var tagName = e.nodeName.toLowerCase();
    if (tagName == 'input' && (e.getAttribute('type') == 'checkbox' || e.getAttribute('type') == 'radio')) {
      if (e.id) {
        var lblXpath = '//label[@for=\'' + e.id + '\']'
        var lblEl = LocatorBuilders.findElement(lblXpath);
        if (lblEl && lblEl.innerText) {
          var labelText = LocatorBuilders.getInnerTextWithoutChildren(lblEl);
          if (labelText.length > 1)
            return labelText;
        }
      }
    }
    return undefined;
  }
  
  //logging = function(message: any) {
  //    browser.runtime.sendMessage({type: "bglog", payload: message});
  //}
  
  static getXPathResult(xpath: any, docObj: any) {
    return docObj.evaluate(xpath,
        docObj,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    );
  }
  
  static isElementUniqueWithXPath(xpath: any, e: { ownerDocument: any }) {
      let result = LocatorBuilders.getXPathResult(xpath, e.ownerDocument);
      return !(result.snapshotLength > 1) && result.snapshotLength != 0;
  }
  
  /**
   * Method to validate the xpath uniqueness across iframes
   * @param xpath
   * @param e
   * @returns {boolean}
   */
  isElementUniqueWithXPathInAllVisibleIframes(xpath: any, e: any): boolean {
    //If xpath is not unique within the iframe return false
    if (!LocatorBuilders.isElementUniqueWithXPath(xpath, e))
      return false;
    var topWindow = window.top;
    //Gajanan: Commented to resolve build issue
    //var self = this;
    var getXPathCountOfInnerIframes = function(currentWindow: Window | null) {
      var iframes = currentWindow?.document.getElementsByTagName('iframe');
      if (iframes?.length == 0)
        return 0;
      var xpathCount = 0;
      if (iframes != null) {
        for (var i = 0; i < iframes.length; i++) {
          var iframe = iframes[i];
          //ignore hidden iframes
          if (topWindow?.getComputedStyle(iframe).visibility == 'hidden' || topWindow?.getComputedStyle(iframe).display == 'none')
            continue;
          var iframeWindow = iframe.contentWindow;
          try {
            //Gajanan: Commented to resolve build issue
            //var docObj = iframeWindow?.document;
          } catch (ex) {
            //ignore cross origin iframes
            continue;
          }
          xpathCount = xpathCount + LocatorBuilders.getXPathResult(xpath, iframeWindow?.document).snapshotLength;
          //check for inner iframes
          xpathCount = xpathCount + getXPathCountOfInnerIframes(iframeWindow);
        }
      }
      return xpathCount;
    };
    var xpathMatchCount = LocatorBuilders.getXPathResult(xpath, topWindow?.document).snapshotLength;
    xpathMatchCount = xpathMatchCount + getXPathCountOfInnerIframes(topWindow);
    return xpathMatchCount == 1;
  }
  
  static getXpathForAttribute(attrName: string, attrValue: string) {
    var splitByNumbers = attrValue.split(/\d+/);
    var xpathCond = '@' + attrName + '=' + LocatorBuilders.attributeValue(attrValue);
    if (splitByNumbers.length > 1) {
      splitByNumbers = splitByNumbers.filter(Boolean);
      xpathCond = '';
      for (let i = 0, j = 0; i < splitByNumbers.length; i++) {
        if (splitByNumbers[i] === '-' || splitByNumbers[i] === '~')
          continue;
        j++;
        if (j > 1)
          xpathCond += ' and ';
        xpathCond += 'contains(@' + attrName + ',' + LocatorBuilders.attributeValue(splitByNumbers[i]) + ')';
      }
    }
    return xpathCond;
  }
  
  static getInnerTextWithoutChildren(node: any) {
    let child = node.firstChild, texts:any = [];
    while (child) {
      if (child.nodeType == 3) {
        texts.push(child.data);
      }
      child = child.nextSibling;
    }
    //Replace &nbsp; with a space
    return texts.join('').replace(/\u00a0/g,' ').trim()
  }

  static findElement(loc: any) {
    try {
      const locator = parse_locator(loc)
      return findElement(
        { [locator.type]: locator.string },
        window.document
      )
    } catch (error) {
      //this.log.debug("findElement failed: " + error + ", locator=" + locator);
      return null
    }
  }
  /*
   * Class methods
   */

  // NOTE: for some reasons we does not use this part
  // classObservable(LocatorBuilders);

  static add(name: string, finder: LocatorFunction) {
    this.order.push(name)
    this.builderMap[name] = finder
    this._orderChanged()
  }

  /**
   * Call when the order or preferred order changes
   */
  static _orderChanged() {
    let changed = this._ensureAllPresent(this.order, this._preferredOrder)
    this._sortByRefOrder(this.order, this._preferredOrder)
    if (changed) {
      // NOTE: for some reasons we does not use this part
      // this.notify('preferredOrderChanged', this._preferredOrder);
    }
  }

  /**
   * Set the preferred order of the locator builders
   *
   * @param preferredOrder can be an array or a comma separated string of names
   */
  static setPreferredOrder(preferredOrder: string | string[]) {
    if (typeof preferredOrder === 'string') {
      this._preferredOrder = preferredOrder.split(',')
    } else {
      this._preferredOrder = preferredOrder
    }
    this._orderChanged()
  }

  /**
   * Returns the locator builders preferred order as an array
   */
  getPreferredOrder() {
    return LocatorBuilders._preferredOrder
  }

  /**
   * Sorts arrayToSort in the order of elements in sortOrderReference
   * @param arrayToSort
   * @param sortOrderReference
   */
  static _sortByRefOrder = function (
    arrayToSort: any[],
    sortOrderReference: any[]
  ) {
    let raLen = sortOrderReference.length
    arrayToSort.sort(function (a, b) {
      let ai = sortOrderReference.indexOf(a)
      let bi = sortOrderReference.indexOf(b)
      return (ai > -1 ? ai : raLen) - (bi > -1 ? bi : raLen)
    })
  }

  /**
   * Function to add to the bottom of destArray elements from source array that do not exist in destArray
   * @param sourceArray
   * @param destArray
   */
  static _ensureAllPresent = function (sourceArray: any[], destArray: any[]) {
    let changed = false
    sourceArray.forEach(function (e) {
      if (destArray.indexOf(e) == -1) {
        destArray.push(e)
        changed = true
      }
    })
    return changed
  }

  /*
   * Utility function: Encode XPath attribute value.
   */
  static attributeValue(value: string) {
    if (value.indexOf("'") < 0) {
      return "'" + value + "'"
    } else if (value.indexOf('"') < 0) {
      return '"' + value + '"'
    } else {
      let result = 'concat('
      let part = ''
      let didReachEndOfValue = false
      while (!didReachEndOfValue) {
        let apos = value.indexOf("'")
        let quot = value.indexOf('"')
        if (apos < 0) {
          result += "'" + value + "'"
          didReachEndOfValue = true
          break
        } else if (quot < 0) {
          result += '"' + value + '"'
          didReachEndOfValue = true
          break
        } else if (quot < apos) {
          part = value.substring(0, apos)
          result += "'" + part + "'"
          value = value.substring(part.length)
        } else {
          part = value.substring(0, quot)
          result += '"' + part + '"'
          value = value.substring(part.length)
        }
        result += ','
      }
      result += ')'
      return result
    }
  }

  static xpathHtmlElement(name: string) {
    if (window.document.contentType == 'application/xhtml+xml') {
      // "x:" prefix is required when testing XHTML pages
      return 'x:' + name
    } else {
      return name
    }
  }

  static relativeXPathFromParent(current: HTMLElement) {
    let index = LocatorBuilders.getNodeNbr(current)
    let currentPath =
      '/' + LocatorBuilders.xpathHtmlElement(current.nodeName.toLowerCase())
    if (index > 0) {
      currentPath += '[' + (index + 1) + ']'
    }
    return currentPath
  }

  static getNodeNbr(current: HTMLElement) {
    let childNodes = current?.parentNode?.childNodes ?? []
    let total = 0
    let index = -1
    for (let i = 0; i < childNodes.length; i++) {
      let child = childNodes[i]
      if (child.nodeName == current.nodeName) {
        if (child == current) {
          index = total
        }
        total++
      }
    }
    return index
  }

  static preciseXPath(xpath: string, e: HTMLElement) {
    //only create more precise xpath if needed
    if (LocatorBuilders.findElement(xpath) != e) {
      let result = e.ownerDocument.evaluate(
        xpath,
        e.ownerDocument,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      )
      //skip first element (result:0 xpath index:1)
      for (let i = 0, len = result.snapshotLength; i < len; i++) {
        let newPath = 'xpath=(' + xpath + ')[' + (i + 1) + ']'
        if (LocatorBuilders.findElement(newPath) == e) {
          return newPath
        }
      }
    }
    return 'xpath=' + xpath
  }

  buildLocatorFromPreferredAttributes(e: any, isFlex: string){
    let i = 0;
    var self = this;
    let attsMap = self.buildAttsMap(e);
    let names:string[] = []
    // try preferred attributes
    for (i = 0; i < LocatorBuilders.PREFERRED_ATTRIBUTES.length; i++) {
      let name = LocatorBuilders.PREFERRED_ATTRIBUTES[i]
      if (attsMap[name] != null) {
        names.push(name)
        let locator = this.attributesXPath(e,
            e.nodeName.toLowerCase(),
            names,
            attsMap, isFlex
        )
        if (e == LocatorBuilders.findElement(locator)) {
          return locator
        }
      }
    }
    return null;
  }

  attributesXPath(e: any, name: any, attNames: any[], attributes: any, isFlex: string){
    let i=0;
    let locator = '//' + LocatorBuilders.xpathHtmlElement(name) + '['
    for (i = 0; i < attNames.length; i++) {
      if (i > 0) {
        locator += ' and '
      }
      let attName = attNames[i]
      if(isFlex == 'true') {
        if (attName == 'action' || attName == 'value')
          locator += '@' + attName + '=' + LocatorBuilders.attributeValue(attributes[attName])
        else
          locator += LocatorBuilders.getXpathForAttribute(attName, attributes[attName])
      }else{
        if (attName == 'action' || attName == 'value' || attName == 'onclick' || attName == 'href')
          locator += '@' + attName + '=' + LocatorBuilders.attributeValue(attributes[attName])
        else
          locator += LocatorBuilders.getXpathForAttribute(attName, attributes[attName])
      }
    }
    locator = locator + "]";
    return LocatorBuilders.preciseXPath(locator, e);
  }

  buildAttsMap(e: any){
    let i=0;
    let attsMap: any = {}
    if (e.attributes) {
      let atts = e.attributes
      for (i = 0; i < atts.length; i++) {
        let att = atts[i]
        if (att.value && att.value.length > 0)
        attsMap[att.name] = att.value
      }
    }
    return attsMap;
  }

  xpathAttr(e: any) {
    return this.buildLocatorFromPreferredAttributes(e, 'false');
  }

}
/*
 * ===== builders =====
 */

// order listed dictates priority
// e.g., 1st listed is top priority

LocatorBuilders.add(
  'css:data-attr',
  function (this: LocatorBuilders, e: HTMLElement) {
    const dataAttributes = ['data-test', 'data-test-id']
    for (let i = 0; i < dataAttributes.length; i++) {
      const attr = dataAttributes[i]
      const value = e.getAttribute(attr)
      if (attr) {
        return `css=*[${attr}="${value}"]`
      }
    }
    return null
  }
)

LocatorBuilders.add('id', function (this: LocatorBuilders, e: HTMLElement) {
  if (e.id) {
    return 'id=' + e.id
  }
  return null
})

LocatorBuilders.add(
  'linkText',
  function (this: LocatorBuilders, e: HTMLElement) {
    if (e.nodeName == 'A') {
      let text = e.textContent || ''
      if (!text.match(/^\s*$/)) {
        return (
          'linkText=' +
          text.replace(/\xA0/g, ' ').replace(/^\s*(.*?)\s*$/, '$1')
        )
      }
    }
    return null
  }
)

LocatorBuilders.add('name', function (this: LocatorBuilders, _e: HTMLElement) {
  const e = _e as HTMLInputElement
  if (e.name) {
    return 'name=' + e.name
  }
  return null
})

LocatorBuilders.add(
  'css:finder',
  function (this: LocatorBuilders, e: HTMLElement) {
    return 'css=' + finder(e)
  }
)

LocatorBuilders.add(
  'xpath:link',
  function (this: LocatorBuilders, e: HTMLElement) {
    if (e.nodeName == 'A') {
      let text = e.textContent || ''
      if (!text.match(/^\s*$/)) {
        return LocatorBuilders.preciseXPath(
          '//' +
          LocatorBuilders.xpathHtmlElement('a') +
            "[contains(text(),'" +
            text.replace(/^\s+/, '').replace(/\s+$/, '') +
            "')]",
          e
        )
      }
    }
    return null
  }
)

LocatorBuilders.add('xpath:img', function (this: LocatorBuilders, _e) {
  const e = _e as HTMLImageElement
  if (e.nodeName == 'IMG') {
    if (e.alt != '') {
      return LocatorBuilders.preciseXPath(
        '//' +
        LocatorBuilders.xpathHtmlElement('img') +
          '[@alt=' +
          LocatorBuilders.attributeValue(e.alt) +
          ']',
        e
      )
    } else if (e.title != '') {
      return LocatorBuilders.preciseXPath(
        '//' +
        LocatorBuilders.xpathHtmlElement('img') +
          '[@title=' +
          LocatorBuilders.attributeValue(e.title) +
          ']',
        e
      )
    } else if (e.src != '') {
      return LocatorBuilders.preciseXPath(
        '//' +
        LocatorBuilders.xpathHtmlElement('img') +
          '[contains(@src,' +
          LocatorBuilders.attributeValue(e.src) +
          ')]',
        e
      )
    }
  }
  return null
})

LocatorBuilders.add('xpath:attributes', function (this: LocatorBuilders, e) {
  const PREFERRED_ATTRIBUTES = [
	  'comppath',
    'id',
    'name',
    'value',
    'type',
    'action',
    'onclick',
  ]
  let i = 0

  const attributesXPath = (
    name: string,
    attNames: string[],
    attributes: Record<string, string>
  ) => {
    let locator = '//' + LocatorBuilders.xpathHtmlElement(name) + '['
    for (i = 0; i < attNames.length; i++) {
      if (i > 0) {
        locator += ' and '
      }
      let attName = attNames[i]
      locator += '@' + attName + '=' + LocatorBuilders.attributeValue(attributes[attName])
    }
    locator += ']'
    return LocatorBuilders.preciseXPath(locator, e)
  }

  if (e.attributes) {
    let atts = e.attributes
    let attsMap: Record<string, string> = {}
    for (i = 0; i < atts.length; i++) {
      let att = atts[i]
      attsMap[att.name] = att.value
    }
    let names:any = []
    // try preferred attributes
    for (i = 0; i < PREFERRED_ATTRIBUTES.length; i++) {
      let name = PREFERRED_ATTRIBUTES[i]
      if (attsMap[name] != null) {
        names.push(name)
        let locator = attributesXPath(e.nodeName.toLowerCase(), names, attsMap)
        if (e == LocatorBuilders.findElement(locator)) {
          return locator
        }
      }
    }
  }
  return null
})

LocatorBuilders.add('xpath:idRelative', function (this: LocatorBuilders, e) {
  let path = ''
  let current = e
  while (current != null) {
    if (current.parentNode != null) {
      path = LocatorBuilders.relativeXPathFromParent(current) + path
      const parentNode = current.parentNode as HTMLElement
      if (
        1 == parentNode.nodeType && // ELEMENT_NODE
        parentNode.getAttribute('id')
      ) {
        return LocatorBuilders.preciseXPath(
          '//' +
          LocatorBuilders.xpathHtmlElement(parentNode.nodeName.toLowerCase()) +
            '[@id=' +
            LocatorBuilders.attributeValue(parentNode.getAttribute('id') as string) +
            ']' +
            path,
          e
        )
      }
    } else {
      return null
    }
    current = current.parentNode as HTMLElement
  }
  return null
})

LocatorBuilders.add('xpath:href', function (this: LocatorBuilders, e) {
  if (e.attributes && e.hasAttribute('href')) {
    let href = e.getAttribute('href') as string
    if (href.search(/^http?:\/\//) >= 0) {
      return LocatorBuilders.preciseXPath(
        '//' +
        LocatorBuilders.xpathHtmlElement('a') +
          '[@href=' +
          LocatorBuilders.attributeValue(href) +
          ']',
        e
      )
    } else {
      // use contains(), because in IE getAttribute("href") will return absolute path
      return LocatorBuilders.preciseXPath(
        '//' +
        LocatorBuilders.xpathHtmlElement('a') +
          '[contains(@href, ' +
          LocatorBuilders.attributeValue(href) +
          ')]',
        e
      )
    }
  }
  return null
})

LocatorBuilders.add(
  'xpath:position',
  function (this: LocatorBuilders, e, opt_contextNode) {
    let path = ''
    let current = e
    while (current != null && current != opt_contextNode) {
      let currentPath
      if (current.parentNode != null) {
        currentPath = LocatorBuilders.relativeXPathFromParent(current)
      } else {
        currentPath =
          '/' + LocatorBuilders.xpathHtmlElement(current.nodeName.toLowerCase())
      }
      path = currentPath + path
      let locator = '/' + path
      if (e == LocatorBuilders.findElement(locator)) {
        return 'xpath=' + locator
      }
      current = current.parentNode as HTMLElement
    }
    return null
  }
)

LocatorBuilders.add('xpath:innerText', function (this: LocatorBuilders, el) {
  if (el.innerText) {
    return `xpath=//${el.nodeName.toLowerCase()}[contains(.,'${el.innerText}')]`
  } else {
    return null
  }
})


export const singleton = new LocatorBuilders(window);
