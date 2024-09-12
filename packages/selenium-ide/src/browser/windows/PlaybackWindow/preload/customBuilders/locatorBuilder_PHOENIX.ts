import LocatorBuilders from "../locator-builders_custom";
import { locatorBuilders } from "../record-handlers_custom";

const PREFERRED_ATTRIBUTES = [
    'data-testid'
]


const NAME_AS_DISPLAY_NAME:any = [];
//const TABLE_INPUTS_DELAY_ON_CLICK:any = [];
const CUSTOM_DISPLAY_NAME_NAMES:any = [];
const LABEL_CLASS_NAMES:any = [];
const TEXT_NBSP_TO_EMPTY_TRANSLATE = "translate(normalize-space(text()),'\\u00a0','')";
// const TEXT_NBSP_TO_SPACE_TRANSLATE = "normalize-space(translate(text(),'\\u00a0',' '))";

export default function locatorBuilder_PHOENIX() {

}

locatorBuilder_PHOENIX.updateAppSpecificOrder = function () {
    console.log('inside Phoenix custom')
    locatorBuilders.buildTableRowCriteriaData = buildTableRowCriteriaData;
    LocatorBuilders.PREFERRED_ATTRIBUTES = PREFERRED_ATTRIBUTES;    
    LocatorBuilders.add('table', table);
    LocatorBuilders.add('xpath:dataTestId', dataTestId);    
    LocatorBuilders.add('name', name);
    LocatorBuilders.add('noId', generateXPathForElementsWithNoIdentifiers);
    LocatorBuilders.add('xpath:innerText', function(e:any) {
        var builtLocator = xpathInnerText(e);
        //Setting displayName to name attribute if it is not defined through out the locatorBuilder methods
        //Move this logic to last locatorBuilder method
        if (LocatorBuilders.recordedType != 'table' && !LocatorBuilders.displayName && e.name && e.name.trim().length > 1) {
            LocatorBuilders.displayName = e.name.trim();
            console.log('setting name:' + LocatorBuilders.displayName + ' as display name');
        }
        return builtLocator;
    });
    var origDisplayNameFn = LocatorBuilders.getDisplayName;
    LocatorBuilders.getDisplayName = function(e:any, ignoreInnerText:any) {        
        //Add any condition which requires some delay before asking for inputs in webapp
//        this.additionalData.requireDelayBeforeRequestToWebapp = TABLE_INPUTS_DELAY_ON_CLICK.some(onClickAttr => elOnClick.includes(onClickAttr.toLowerCase()));
        var displayName = origDisplayNameFn(e, ignoreInnerText);
        if (ignoreInnerText == true && e.getAttribute('title'))
            displayName = undefined;
        if(e.name && CUSTOM_DISPLAY_NAME_NAMES.includes(e.name)){
            displayName = undefined;
        }if(e.name && NAME_AS_DISPLAY_NAME.includes(e.name)){
            displayName = e.name;
        }
//        if (!displayName) {
//            console.log('custom Flex displayName' +  e);
//            displayName = getCustomDisplayNameFn(e);
//        }
        if((e.id && (e.id.toLowerCase().endsWith('operator') || e.id.toLowerCase().endsWith('operators')))
            || (e.name && (e.name.toLowerCase().endsWith('operator') || e.name.toLowerCase().endsWith('operators')))) {
            displayName = displayName + "- Operator"
        }
        if(!displayName && e.getAttribute('alt')){
            displayName = e.getAttribute('alt')
        }
        return displayName;
    };
}




var buildTableHeaderData = function(headerContainer:any, colId:any, tableData:any) {
    var headerText;
    var headerCell = headerContainer.querySelectorAll('[col-id="'+colId+'"]')[0];
        if(!headerCell){
            return undefined;
        }
    
    if (headerCell.querySelectorAll('.ag-header-cell-text')[0]){
        headerText = headerCell.querySelectorAll('.ag-header-cell-text')[0].textContent.replace(/\u00a0/g, ' ').trim();
    }
    if (headerCell.querySelectorAll('.ant-checkbox-input')[0])
        tableData.columnType = 'CHECKBOX_INDEX';
    else if (headerCell.querySelectorAll('input[type=radio]')[0])
        tableData.columnType = 'RADIO_INDEX';
    else if (headerText.length > 1) {
        tableData.columnType = 'HEADER_NAME';
        tableData.columnName = headerText;
    }else if (headerText.length == 0)
        tableData.columnType = 'BLANK_INDEX';
    return tableData;
};

var buildTableElementData = function(e:any, tableData:any) {
    //setting HEADER_NAME for table headers as we are fetching only for header actions
    var elementType = '', innerText = '';
    var nodeName = e.nodeName.toLowerCase();
    var eType = e.type ? e.type.toLowerCase() : '';
    var buttonEle = e.closest('button');
    if(nodeName == 'span' && (buttonEle && buttonEle.getAttribute('class') && buttonEle.getAttribute('class').indexOf('ant-btn-link') > -1)){
        elementType = 'LINK';
        innerText = e.textContent ? e.textContent.replace(/\u00a0/g,' ').trim() : '';
    }else if ((nodeName == 'input' && eType != 'hidden') || nodeName == 'select' || nodeName == 'textarea') {
        elementType = 'OTHER';
        if (eType == 'checkbox' || eType == 'radio')
            innerText = e.checked ? 'on' : 'off';
        else if (nodeName == 'input' || nodeName == 'textarea')
            innerText = e.value;
        else if (nodeName == 'select')
            innerText = e.options[e.selectedIndex].text.replace(/^ *(.*?) *$/, '$1');
    } else if (nodeName == 'button' || (e.getAttribute('class') && e.getAttribute('class').indexOf('ag-icon-menu') > -1))
        elementType = 'BUTTON';
    else if (nodeName == 'img' || (nodeName == 'a' && e.querySelectorAll('img')[0])) {
        var imgNode = nodeName == 'img' ? e : e.querySelectorAll('img')[0];
        var srcAttr = imgNode.getAttribute('src');
        if (srcAttr && (srcAttr.endsWith('/checked.png') || srcAttr.endsWith('/unchecked.png'))) {
            elementType = 'OTHER';
            innerText = srcAttr.endsWith('/checked.png') ? 'on' : 'off';
        } else
            elementType = 'IMAGE';
    } else {
        elementType = 'PLAIN_TEXT';
        innerText = e.textContent ? e.textContent.replace(/\u00a0/g,' ').trim() : '';
    }
    tableData.elementType = elementType;
    tableData.expectedValue = innerText;
    return tableData;
};

var handleAgGrid = function(e:any) {
    var elementClass = e.getAttribute('class');
    var tableData:any;
    var rowType = 'data';
    if(elementClass && elementClass.indexOf("ag-icon ag-icon-menu")>-1){
        rowType = 'header';
    }
    var divElement = e.closest('div.ag-cell,div.ag-header-cell');
    var className = divElement.getAttribute('class');
    if(!className ||  !className.startsWith('ag-') ){
        return undefined;
    }
    var colId = divElement.getAttribute('col-id');

    if(!colId){
        //Check if it is header cell
        if(className.startsWith('ag-header'))
        rowType = 'header';
    }
    var columnContainer = e.closest('.ag-root').querySelector('.ag-header');
    if(!columnContainer)
    {
        return undefined;
    }

    tableData.rowType = rowType;
    tableData = buildTableElementData(e, tableData);
    tableData = buildTableHeaderData(columnContainer, colId ,tableData);
    tableData.name = e.closest('.ant-card-body').closest("[data-testid]").getAttribute("data-testid");
    return tableData;
};

function table(e:any) {    
    var tableData = buildTableRowCriteriaData(e);
    if (!LocatorBuilders.recordedType && tableData) {
        LocatorBuilders.recordedType = 'table';
        var tableName = tableData.name;
        delete tableData.name;
        Object.assign(LocatorBuilders.additionalData, tableData);
        LocatorBuilders.displayName = '';
        return 'table=' + tableName;
    }
    return null;
}

function buildTableRowCriteriaData(e:any) {
    try {
        var tableData;
        tableData = handleAgGrid(e);
        if (!tableData)
            return undefined;
        if (tableData.rowType == 'header')
            delete tableData.expectedValue;
        console.log('Table Data:' + JSON.stringify(tableData));
        return tableData;
    } catch (ex) {
        console.error(ex)
    }
    return undefined;
}


function name(e:any) {
    if(e.nodeName.toLowerCase() == 'input' && (e.getAttribute('type') == 'radio' ||
        (e.getAttribute('type') == 'checkbox') && e.closest('tr[id=trrule]'))){
        return null;
    }
    if (e.name && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@name='" + e.name+ "' and not(@type = 'hidden')]", e))
        return 'name=' + e.name;
    return null
}


function dataTestId(e:any) {

    var tagName = e.tagName.toLowerCase();
    var xpath;
    if (e.getAttribute('data-testid') && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@data-testid='" + e.getAttribute('data-testid')+ "' and not(@type = 'hidden')]", e)){
        xpath = "//*[@data-testid='" + e.getAttribute('data-testid') + "' and not(@type = 'hidden')]";
        return 'xpath=' +xpath;
    }
    else if((tagName == 'span' || tagName == 'svg' || tagName == 'path' ) && (e.closest('button') && e.closest('button').getAttribute('data-testid'))){
             xpath = "//*[@data-testid='" + e.closest('button').getAttribute('data-testid') + "' and not(@type = 'hidden')]//*[local-name()='"+tagName+"']";
             if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(xpath, e))
                 return "xpath=" + xpath;
     }
     else if(tagName == 'input' && (e.closest('li') && e.closest('li').getAttribute('data-testid'))){
        xpath = "//*[@data-testid='" + e.closest('li').getAttribute('data-testid') + "' and not(@type = 'hidden')]//*[local-name()='"+tagName+"']";
        if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(xpath, e))
             return "xpath=" + xpath;
     }
    return null
}



function generateXPathForElementsWithNoIdentifiers(e:any) {
    var locator;
    var detailedPageForm = e.closest('form');
    var type = e.getAttribute('type');
    var tagName = e.nodeName.toLowerCase();
    var labelName;
    var xpath = '';
    //Not handling few elements where there are onclicks and few specific buttons
    if ((tagName == 'input' && e.getAttribute('onclick')
        && type.toLowerCase() == 'button') || (tagName == 'input' && type == 'radio')) {
        return null;
    }//Not handling grid actions here
    else if (tagName == 'span' && e.getAttribute("class") && e.getAttribute("class").indexOf('header_icon_info') > -1
        && e.closest('a') && (e.closest('a').getAttribute('href') || e.closest('a').getAttribute('onclick'))) {
        return null;
    }
    if(isHavingOneOfProvidedClassList(e, ['tblheadertitle']) && e.children.length==0){
        labelName = LocatorBuilders.getInnerTextWithoutChildren(e);
        locator = "//td[contains(@class,'" + e.getAttribute('class') + "') and " + getXPathWithLabelText(labelName) + "]";
    }
    //Handling one set of pattern where the td itself has the label and relative to the form
    else if(isHavingOneOfProvidedClassList(e, LABEL_CLASS_NAMES)){
        console.log('Found label td itself');
        labelName = LocatorBuilders.getInnerTextWithoutChildren(e);
        if(tagName != 'td'){
            var closestTdClass = e.closest('td').getAttribute('class') || ""
            xpath = "//td[contains(@class,'" + closestTdClass+"')]//"+tagName+"["+getXPathWithLabelText(labelName)+"]";
        }else{
            xpath = "//td[contains(@class,'" + e.getAttribute('class') + "') and " + getXPathWithLabelText(labelName) + "]";
        }
        if(detailedPageForm){
            locator = "//form[@name='" + detailedPageForm.getAttribute('name') + "']"+ xpath;
        }else {
            locator = xpath;
        }
    }//Handling cases where the label td needs to be found by traversing relative to the form
    else {
        console.log('Finding label td by traversing');
        var element = e;
        var leafNode = '';
        if (e.nodeName.toLowerCase() != 'td') {
            element = e.closest("td");
            leafNode = '//' + e.nodeName.toLowerCase();
        }
        var prevLabelElement;
        if (isHavingOneOfProvidedClassList(element, LABEL_CLASS_NAMES)){
            prevLabelElement = element;
        }
        if (!prevLabelElement && e.getAttribute('class') == "section_header_detail_text" && e.tagName == "SPAN") {
            locator = "//" + tagName + "[@class='section_header_detail_text' and contains(text(), '" + e.textContent.trim() + "')]";
            if(e == LocatorBuilders.findElement(locator)){
                return 'xpath='+ locator;
            }
            return null;
        }
        var label;
        if(LocatorBuilders.getInnerTextWithoutChildren(prevLabelElement).length == 0 && prevLabelElement.children.length == 1){
            var childNode = prevLabelElement.querySelector('*');
            label = childNode ? getText(childNode) : undefined;
        }else{
            label = getText(prevLabelElement);
        }
        var labelTagName = prevLabelElement.nodeName.toLowerCase();
        if ((prevLabelElement.children.length > 0) && ((prevLabelElement.firstChild.tagName != undefined) && (prevLabelElement.firstChild.tagName.toLowerCase() == "donotusestrong"))) {
            xpath = "//*[contains(" + TEXT_NBSP_TO_EMPTY_TRANSLATE + ",'" + label + "')]" + "/parent::td[1]" + "/following-sibling::td[1]";
        } else {
            xpath = "//*[" + TEXT_NBSP_TO_EMPTY_TRANSLATE + "='" + label + "']" + (labelTagName != 'td' ? "/parent::td[1]" : "") + "/following-sibling::td[1]";
        }
        if (detailedPageForm) {
            locator = "(//form[@name='" + detailedPageForm.getAttribute("name") + "']" + xpath + leafNode + ")[last()]";
        } else {
            locator = "(" + xpath + leafNode + ")[last()]";
        }
    }
    if (locator && e== LocatorBuilders.findElement(locator)) {
        LocatorBuilders.displayName = labelName ? labelName.trim() : LocatorBuilders.displayName;
        return 'xpath=' + locator;
    }
    return null;
}


function getText(e:any) {
    var text = LocatorBuilders.getInnerTextWithoutChildren(e);
    if(!text){
        text = e.textContent.replace(/\u00a0/g,' ').trim();
    }
    return text;
}

function getXPathWithLabelText(labelName:string) {
    return "(" + TEXT_NBSP_TO_EMPTY_TRANSLATE + "='" + labelName + "' or text()[normalize-space()='"+labelName+"'] or .//*[" + TEXT_NBSP_TO_EMPTY_TRANSLATE + "='" + labelName + "'])";
}

function getSpecificTagXPathWithLabelText(labelName:string) {
    return "(" + TEXT_NBSP_TO_EMPTY_TRANSLATE + "='" + labelName + "' or text()[normalize-space()='"+labelName+"'])";
}

function getXPathWithStartsWithLabelText(labelName:string) {
        return "starts-with(text()[normalize-space()],'"+ labelName +"') or starts-with(normalize-space(text()),'"+ labelName +"')" +
        " or starts-with(("+TEXT_NBSP_TO_EMPTY_TRANSLATE+"),'"+labelName+"')";
}

/**
 * Method to determine if provided element has one of class list
 * @returns {boolean}
 */
function isHavingOneOfProvidedClassList(e:any, classList:[string]) {
    return e.hasAttribute('class') && classList.some(className => new RegExp('\\b'+className+'\\b', 'gi').test(e.getAttribute('class').trim()));
}




/**
 * Method to go with innerText or anything related to innerText
 * @param e
 * @returns {*}
 */
function xpathInnerText(e:any) {
    if (!e.innerText)
        return null;
    var elClass = e.getAttribute('class') || '';
    //ignore all menu pane header having below class
    if (elClass.indexOf('menu_pane_header') > -1)
        return null;
    var isXPathUnique = function(inXPath:string, displayName:string) {
        if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(inXPath, e)) {
            if (!LocatorBuilders.displayName && displayName && displayName.length > 1)
                LocatorBuilders.displayName = displayName;
            return true;
        }
        return false;
    };
    var tagName = e.nodeName.toLowerCase();
    var innerTextWithChildren = e.innerText ? e.innerText.trim() : '';
    if (innerTextWithChildren) {
        if (!innerTextWithChildren.includes(':') && e.children.length == 0) {
            var equalsInnerTextXPath = "//" + tagName + "["+ getSpecificTagXPathWithLabelText(innerTextWithChildren)+"]";
            if (isXPathUnique(equalsInnerTextXPath,innerTextWithChildren))
                return equalsInnerTextXPath;
        }
        if (innerTextWithChildren.includes(':') && e.children.length == 0) {
            var startsWithInnerTextXPath = "//" + tagName + "["+getXPathWithStartsWithLabelText(innerTextWithChildren.split(':')[0] +":")+"]";
            if (isXPathUnique(startsWithInnerTextXPath, innerTextWithChildren.split(':')[0]))
                return startsWithInnerTextXPath;
        }
        if (e.children.length == 1) {
            var innerTextWithOutChildren = LocatorBuilders.getInnerTextWithoutChildren(e);
            var childrenEl = e.querySelector('*');
            var childInnerText = childrenEl ? LocatorBuilders.getInnerTextWithoutChildren(childrenEl) : '';
            if (innerTextWithOutChildren && childInnerText) {
                var xpath,displayName;
                if (!innerTextWithOutChildren.includes(':') && innerTextWithChildren.startsWith(childInnerText)) {
                    xpath = "//" + tagName + "[./" + childrenEl.tagName.toLowerCase() + "["+getSpecificTagXPathWithLabelText(childInnerText)+"]]";
                    displayName = childInnerText;
                } else if (!childInnerText.includes(':') && innerTextWithChildren.startsWith(innerTextWithOutChildren)) {
                    xpath = "//" + tagName + "["+ getXPathWithStartsWithLabelText(innerTextWithChildren)+"]";
                    displayName = innerTextWithOutChildren;
                }
                if (xpath && isXPathUnique(xpath, displayName))
                    return xpath;
            }
        }
    }
    return null;
}
