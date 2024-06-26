/**
 * Created by Tvegiraju on 12/27/2019.
 */

import LocatorBuilders from "../locator-builders_custom";
import { locatorBuilders } from "../record-handlers_custom";


const PREFERRED_ATTRIBUTES = [
    'name',
    'value',
    'onclick',
    'type',
    'action',
    'href',
    'onchange',
    'onkeypress',
    'title',
    'id',
    'onmousedown',
    'src'
]

const LABEL_XPATH = "//ancestor::table[2]/parent::td/preceding-sibling::td//label[contains(@class,'control_header_label')]";

const LABEL_DROP_XPATH = "//ancestor::tr[2]//td[contains(@class,'control_header_label')]";

const LABEL_CLASS_NAMES = ['control_header_label','drawer-form-table-label','pagingTagFontRight','label'];

const IDS_TO_IGNORE = ['quickSearchKey','quickSearchValue','quickSearchOperator', 'quickSearchValueGoButton',
    'advSearchButton','advSearchClearButton','toggleSave','selectPage1','selectPage2'];
const IDS_TO_SKIP_RECORDING = ['ecm.right.pane.element.id'];

//Ignore IDs for below class, as random IDs are generated
const CLASSES_TO_IGNORE_IN_IDS = ['truncatedValueWidth', 'truncatedBreadCrumbWidth', 'header_icon_info'];

//Table for which we have special cases in which we have to ignore table
const TABLE_SPECIAL_CASE_CLASSES = ['tblcellwhite'];

//Ignore below form names in table with special class
const TABLE_FORM_NAMES_TO_IGNORE: string | any[] = [];

//Ignore table inside below form names
const IGNORE_TABLE_FORM_ACTIONS = ['/gp/importAction.do?operation=goBackToMapping'];

//Table rows (body/header) class list
const TABLE_ROW_CLASS_LIST = ['tblrowover', 'tblaltrow', 'tblrow', 'rowHighlited', 'tblChildRow', 'tblcellwhite', 'tblcellgrey', 'newRowHighlighted', 'tblcolmtitle', 'tblcaption', 'tblcolumntitle_notused', 'mediumBlue_menu_row_highlight'];
//Table header row class list
const TABLE_HEADER_CLASS_LIST = ['tblcolmtitle', 'tblcaption', 'tblcolumntitle_notused'];

const TABLE_CUSTOM_ATTR = 'altid';

const BUTTON_IDS_TO_IGNORE = ['advSearchButton','advSearchClearButton'];

const CHECK_BOX_NAMES_TO_IGNORE = ['caseSensitiveSearch','viewAll'];

const NAMES_TO_IGNORE = ['searchValue'];

const CUSTOM_DISPLAY_NAME_IDS = ['addErrors','addReason', 'removeErrors', 'removeReason'];

const CUSTOM_DISPLAY_NAME_NAMES = ['rowSize', 'searchValue'];

const NAME_AS_DISPLAY_NAME = ['searchDescription'];

const finderNamesToAddLocatorEvenIfElNotMatched = [
    'xpath:leftNav',
    'xpath:contentEditableFormulaField',
    'xpath:gpPriceStatusChangeAction',
    'navBar'
];

//Gajanan: Commented to resolve build issue
//choosers inside a table which opens a new window
// const TABLE_INPUTS_DELAY_ON_CLICK = [
//     'popup',
//     'opennewtpparentselector',
//     'openSingleUserProjectRoleSelector',
//     'icn_edit.png',
//     'opencharacteristicsselector',
//     'javascript:selectproductid',
//     'javascript:selectprodtoadd',
//     'javascript:selecttp',
//     'javascript:selectparenttp',
//     'selectrepocol',
//     'javascript:viewperformers',
//     'javascript:showactionhistory',
//     'javascript:showworkflowimage',
//     'javascript:openworkitem',
//     'image/icn_edit.gif',
//     'javascript:showbobselector'
// ];

const TEXT_NBSP_TO_EMPTY_TRANSLATE = "translate(normalize-space(text()),'\\u00a0','')";
const TEXT_NBSP_TO_SPACE_TRANSLATE = "normalize-space(translate(text(),'\\u00a0',' '))";

export default function locatorBuilder_Flex() {

}

locatorBuilder_Flex.updateAppSpecificOrder = function () {
    console.log('inside Flex custom')
    locatorBuilders.buildTableRowCriteriaData = buildTableRowCriteriaData;
    LocatorBuilders.PREFERRED_ATTRIBUTES = PREFERRED_ATTRIBUTES;
    LocatorBuilders.finderNamesToAddLocatorEvenIfElNotMatched = finderNamesToAddLocatorEvenIfElNotMatched;
    locatorBuilders.isElementEligibleForRecording = isElementEligibleForRecordingCustom;
    locatorBuilders.isElementFoundByLocatorNotMatchedEligibleForRecording = isElementFoundByLocatorNotMatchedEligibleForRecordingCustom;
    LocatorBuilders.add('table', table);
    LocatorBuilders.add('gwtNonTable', handleGWTNonTablePatterns);
    LocatorBuilders.add('dragDropList', dragDropList);
    LocatorBuilders.add('xpath:leftNav', handleLeftNavPattern);
    LocatorBuilders.add('xpath:successErrorMsgs', handleSuccessErrorMessagesPattern);
    LocatorBuilders.add('xpath:menuinnerheader', handleMenuInnerPaneHeadersPattern);
    LocatorBuilders.add('xpath:gpSubmissionFileTemplateForm', handleGPSubmissionFileTemplateFormFields);
    LocatorBuilders.add('xpath:gpPublishSettings', handleGPPublishSettingsPattern);
    LocatorBuilders.add('xpath:gpFormulaValidationImages', handleGPFormulaValidationImages);
    LocatorBuilders.add('xpath:contentEditableFormulaField', handleContentEditableFieldRecording);
    LocatorBuilders.add('xpath:gpPriceStatusChangeAction', handleGPPriceStatusChangeAction);
    LocatorBuilders.add('xpath:gpImportActionForm', handleGPImportActionForm);
    LocatorBuilders.add('xpath:fieldSet', handleFieldSetMovePattern);
    LocatorBuilders.add('xpath:saveSearch', handleSaveSearchPattern);
    LocatorBuilders.add('id', id);
    LocatorBuilders.add('navBar', navBar);
    LocatorBuilders.add('name', name);
    LocatorBuilders.add('xpath:quickLinks', generateXPathForQuickLinks);
    LocatorBuilders.add('xpath:noIdOrName', generateXPathForElementsWithNoIdentifiers);
    LocatorBuilders.add('xpath:attributesForRadioButtons', xpathAttrForRadioButtons);
    LocatorBuilders.add('xpath:attributes', xpathAttr);
    LocatorBuilders.add('xpath:innerText', function(e: any) {
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
    LocatorBuilders.getDisplayName = function(e: any, ignoreInnerText: any) {
        //Gajanan: Commented to resolve build issue
        //var elOnClick = (e.getAttribute('onclick') || e.getAttribute('href') || (e.tagName.toLowerCase() == 'img' && e.getAttribute('src')) || '').toLowerCase();
        //Add any condition which requires some delay before asking for inputs in webapp
        //this.additionalData.requireDelayBeforeRequestToWebapp = TABLE_INPUTS_DELAY_ON_CLICK.some(onClickAttr => elOnClick.includes(onClickAttr.toLowerCase()));
        var displayName = origDisplayNameFn(e, ignoreInnerText);
        //For Flex, ignoring title as display name for readActions as almost all read only text fields has title which contains data
        if (ignoreInnerText == true && e.getAttribute('title'))
            displayName = undefined;
        if(e.name && CUSTOM_DISPLAY_NAME_NAMES.includes(e.name)){
            displayName = undefined;
        }if(e.name && NAME_AS_DISPLAY_NAME.includes(e.name)){
            displayName = e.name;
        }
        if (!displayName) {
            console.log('custom Flex displayName' +  e);
            displayName = getCustomDisplayNameFn(e);
        }
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

function getImmediateChildrenWithSelector(parentEl: any, cssSel: any) {
    return Array.from(parentEl.children).filter(function(child: any) {return child.matches(cssSel)})
};

var getHeaderColumnCellsInTable = function(e: any, tableEl: any) {
    var parGridTag = tableEl.tagName.toLowerCase();
    var parGridClass = tableEl.getAttribute('class') || '';
    var headerTDs;
    if (parGridTag == 'table' && parGridClass == 'data-table') {
        headerTDs = tableEl.querySelectorAll('thead th');
    } else if (e.closest('.listGrid')) {
        headerTDs = tableEl.querySelectorAll('div.headerBar div[onscroll]:not(.headerButton) td[class*=headerTitle]');
    } else {
        var headerTRs = tableEl.querySelectorAll('.' + TABLE_HEADER_CLASS_LIST.join(',.'));
        for (var i = 0; i < headerTRs.length; i++) {
            var headerTR = headerTRs[i];
            if (window.getComputedStyle(headerTR).visibility != 'hidden' && window.getComputedStyle(headerTR).display != 'none') {
                headerTDs = headerTR.querySelectorAll('td,th');
                break;
            }
        }
    }
    return headerTDs;
};

var buildTableHeaderData = function(headerCell: any, tableData: any) {
    var headerText;
    if(headerCell.querySelectorAll("[class*=truncatedBreadCrumb]")[0]  && headerCell.querySelectorAll("script")[0]){
        headerText = getText(headerCell.querySelectorAll("[class*=truncatedBreadCrumb]")[0]).replace(/\u00a0/g,' ').trim();
    }else {
        headerText = headerCell.textContent.replace(/\u00a0/g, ' ').trim();
    }
    var imgCell = headerCell.querySelector('img');
    if (headerCell.querySelectorAll('input[type=checkbox]')[0])
        tableData.columnType = 'CHECKBOX_INDEX';
    else if (headerCell.querySelectorAll('input[type=radio]')[0])
        tableData.columnType = 'RADIO_INDEX';
    else if (headerText.length > 1) {
        tableData.columnType = 'HEADER_NAME';
        tableData.columnName = headerText;
    } else if (imgCell) {
        if (imgCell.hasAttribute('src') && imgCell.getAttribute('src').endsWith('checked.png'))
            tableData.columnType = 'CHECKBOX_INDEX';
        else
            tableData.columnType = 'IMAGE_INDEX';
    } else if (headerText.length == 0)
        tableData.columnType = 'BLANK_INDEX';
    return tableData;
};

var buildTableElementData = function(e: any, tableData: any) {
    //setting HEADER_NAME for table headers as we are fetching only for header actions
    var elementType = '', innerText = '';
    var nodeName = e.nodeName.toLowerCase();
    var eType = e.type ? e.type.toLowerCase() : '';
    if(e.className == 'truncatedValueWidth' && (e.parentElement.parentElement.nodeName.toLowerCase()) == 'a'){
        elementType = 'LINK';
        innerText = e.textContent ? e.textContent.replace(/\u00a0/g,' ').trim() : '';
    }
    else if (nodeName == 'a' && !e.querySelectorAll('img')[0]) {
        elementType = 'LINK';
        innerText = e.textContent ? e.textContent.trim() : '';
        innerText = e.textContent ? e.textContent.replace(/\u00a0/g,' ').trim() : '';
    } else if ((nodeName == 'input' && eType != 'hidden') || nodeName == 'select' || nodeName == 'textarea') {
        elementType = 'OTHER';
        if (eType == 'checkbox' || eType == 'radio')
            innerText = e.checked ? 'on' : 'off';
        else if (nodeName == 'input' || nodeName == 'textarea')
            innerText = e.value;
        else if (nodeName == 'select')
            innerText = e.options[e.selectedIndex].text.replace(/^ *(.*?) *$/, '$1');
    } else if (nodeName == 'button')
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

/**
 * Method to handle table in GWT
 * @param e
 */
var handleGWTTable = function(e: any) {
    //check if e is inside either body or header
    if (!e.closest('.alternateGridBody,.headerBar,table.data-table'))
        return undefined;
    var rowType = e.closest('.headerBar,th') ? 'header' : 'data';
    var tableData: any;
    tableData.rowType = rowType;
    tableData = buildTableElementData(e, tableData);
    var parGridEl = e.closest('.listGrid,table.data-table');
    var headerTDs = getHeaderColumnCellsInTable(e, parGridEl);
    if (headerTDs && headerTDs.length > 0 ) {
        var tr = e.closest('tr');
        var useParentTable = false;
        if (e.closest('td.formCell,td.formCellFocused,table.selectItemControl')) {
            useParentTable = true;
            tr = tr.parentNode.closest('tr')
        }
        var TDs = getImmediateChildrenWithSelector(tr, 'td');
        var tdIdx = Array.from(TDs).indexOf(useParentTable ? e.closest('td').parentNode.closest('td') : e.closest('td'));
        if (tdIdx != -1 && tdIdx <= headerTDs.length)
            tableData = buildTableHeaderData(headerTDs[tdIdx], tableData);
    }
    tableData.name = parGridEl.hasAttribute('eventproxy') ? parGridEl.getAttribute('eventproxy').trim() : parGridEl.id ? parGridEl.id.trim() : 'GWTTable';
    return tableData;
};

var handleNormalTable = function(e: any) {
    var closestTR = e.closest('tr');
    if (!closestTR)
        return undefined;
    var trClass = closestTR.getAttribute('class') || '';
    //In Mapping sets->Conversion tab, Repositorycolumn is part of another table
    if (trClass == '' && e.closest('table#conversiontbl')) {
        closestTR = closestTR.parentNode.closest('tr');
        trClass = closestTR.getAttribute('class') || '';
    }
    var tbody = closestTR.closest('tbody');
    //handle case where only header has class for other body rows, won't have any class
    var isHeaderDefinedInTbody = tbody && getImmediateChildrenWithSelector(tbody, 'tr.tblcolmtitle').length == 1;
    if (!isHavingOneOfProvidedClassList(closestTR, TABLE_ROW_CLASS_LIST) && !isHeaderDefinedInTbody)
        return undefined;
    //Ignore tables inside few forms IGNORE_TABLE_FORM_NAMES
    var ignoreFormSelector = '';
    for (var i = 0; i < IGNORE_TABLE_FORM_ACTIONS.length; i++) {
        ignoreFormSelector = 'form[action="' + IGNORE_TABLE_FORM_ACTIONS[i] + '"]' + (i > 0 ? ',' + ignoreFormSelector : '');
    }
    if (e.closest(ignoreFormSelector))
        return undefined;

    var formSelector = '';
    //Using below table contains tr having header classes condition for these forms
    //'contractCopyForm', 'changeDatesForm', 'workItemsForm', 'productChangeDatesForm'
    for (var i = 0; i < TABLE_FORM_NAMES_TO_IGNORE.length; i++) {
        formSelector = "form[name=" + TABLE_FORM_NAMES_TO_IGNORE[i] + "]" + (i > 0 ? "," + formSelector : "");
    }
    var trSelector = '';
    for (var i = 0; i < TABLE_HEADER_CLASS_LIST.length; i++) {
        trSelector = "tr." + TABLE_HEADER_CLASS_LIST[i] + (i > 0 ? "," + trSelector : "");
    }
    //Few fields are inside a table of same pattern but not required as tables
    if (isHavingOneOfProvidedClassList(closestTR, TABLE_SPECIAL_CASE_CLASSES) && (closestTR.querySelector('.control_header_label')
        || closestTR.querySelector('td[class*=tblheader]')
        || !closestTR.closest('table').querySelector(trSelector)
        || (formSelector && closestTR.closest(formSelector))))
        return undefined;
    //Handle close button which is part of table body rows itself
    if (e.tagName.toLowerCase() == 'input' && e.getAttribute('type') == 'button' && e.id == 'closeButton')
        return undefined;
    var isChildRow;
    if (trClass.indexOf('tblChildRow') > -1) {
        isChildRow = "true";
    }
    var table = e.closest('table');
    //dummy table id if ID is not defined
    var tableId = table.id ? table.id.trim() : 'table';
    //Store form action (if exist) for all tables
    var form = table.closest('form');
    var formAction;
    if (form && form.hasAttribute('action')) {
        formAction = form.getAttribute('action');
    }
    var rowType = 'data';
    if (isHavingOneOfProvidedClassList(closestTR, TABLE_HEADER_CLASS_LIST))
        rowType = 'header';
    var tableData: any;
    tableData.rowType = rowType;
    tableData = buildTableElementData(e, tableData);
    var headerTDs = getHeaderColumnCellsInTable(e, table);
    if (headerTDs && headerTDs.length > 0) {
        var altIdSelector = '[' + TABLE_CUSTOM_ATTR + ']';
        var closestAltIdEl = e.closest(altIdSelector);
        var childAltIdEl = e.querySelectorAll(altIdSelector)[0];
        var altId = closestAltIdEl ? closestAltIdEl.getAttribute(TABLE_CUSTOM_ATTR) : (childAltIdEl ? childAltIdEl.getAttribute(TABLE_CUSTOM_ATTR) : '');
        var headerAltIdSel = '.' + TABLE_HEADER_CLASS_LIST.join(' [' + TABLE_CUSTOM_ATTR + '="' + altId + '"],.') + ' [' + TABLE_CUSTOM_ATTR + '="' + altId + '"]';
        if ((closestAltIdEl || childAltIdEl) && altId && table.querySelectorAll(headerAltIdSel)[0]) {
            tableData.altId = altId;
            var headerEls = table.querySelectorAll(headerAltIdSel);
            //always use last element
            var headerEl = headerEls[headerEls.length - 1];
            tableData = buildTableHeaderData(headerEl, tableData);
        } else {
            var useParentTable = false;
            var tr = e.closest('tr');
            if (e.closest('table#conversiontbl') && !tr.getAttribute('class')) {
                useParentTable = true;
                tr = tr.parentNode.closest('tr');
            }
            var TDs = getImmediateChildrenWithSelector(tr, 'td');
            var tdIdx = Array.from(TDs).indexOf(useParentTable ? e.closest('td').parentNode.closest('td') : e.closest('td'));
            if (tdIdx != -1 && tdIdx <= headerTDs.length)
                tableData = buildTableHeaderData(headerTDs[tdIdx], tableData);
        }
    }
    if(formAction)
        tableData.advancesSearchFormContainer = formAction;
    if(isChildRow == "true")
        tableData.isChildRow = "true";
    tableData.name = table.getAttribute('name') ? table.getAttribute('name').trim() : tableId;
    return tableData;
};

function table(e: any) {
    var additionalData: any;
    var recordedType: any;
    var tableData = buildTableRowCriteriaData(e);
    if (!recordedType && tableData) {
        recordedType = 'table';
        var tableName = tableData.name;
        delete tableData.name;
        Object.assign(additionalData, tableData);
        return 'table=' + tableName;
    }
    return null;
}

function buildTableRowCriteriaData(e: any) {
    try {
        var tableData;
        if (e.closest('#gwt-content-container'))
            tableData = handleGWTTable(e);
        else
            tableData = handleNormalTable(e);
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

function handleGWTNonTablePatterns(e: any) {
    var additionalData: any;
    //Handle pickListMenu items in GWT tables
    if (e.closest('div.pickListMenuBody,div.windowBody,div.windowHeader'))
        return handleGWTPickList(e);
    if(!e.closest('#gwt-content-container')){
        return null;
    }
    var tagName = e.nodeName.toLowerCase();
    var type = e.getAttribute('type');
    if(e.id || e.name || type == 'button'){
        if(tagName == 'img'){
            return null;
        }else{
            var labelNode = e.closest('tr').querySelectorAll('.wizard-form-table-label')[0];
        }
    }
    var locator;
    var label;
    if(e.getAttribute('class') && e.getAttribute('class') == 'step-container'){
        locator = "//"+tagName+"[@class='step-container' and "+getXPathWithLabelText(getText(e))+"]";
    }
    else if(((tagName=='input' && type && type == 'radio')  || tagName=='select')){
        var gwtRadio = e.closest('.gwt-RadioButton');
        var radioLabel = gwtRadio ? gwtRadio.querySelectorAll('label')[0] : undefined;
        label = radioLabel ? getText(radioLabel) : undefined;
        if (label) {
            locator = "//label[" + getXPathWithLabelText(label) + "]//ancestor::*[contains(@class,'gwt-RadioButton')]//input";
            additionalData.innerText = label;
            var closestTable = e.closest('.form-table');
            if (closestTable) {
                labelNode = closestTable.querySelectorAll('.wizard-form-table-label')[0];
            }

        }else if (e.closest('tr') && e.closest('tr').querySelectorAll('.gwt-Label')[0]) {
            var gwtLabel = e.closest('tr').querySelectorAll('.gwt-Label')[0];
            if (gwtLabel) {
                label = getText(gwtLabel);
                locator = "//div[@class='gwt-Label' and " + getXPathWithLabelText(label) + "]//ancestor::tr[1]//" + tagName;
                additionalData.innerText = label;
            }
        }
    }
    if(!locator && e.closest('tr') && e.closest('tr').querySelectorAll('.wizard-form-table-label,.form-table-label')[0]){
        var labelNode = e.closest('tr').querySelectorAll('.wizard-form-table-label,.form-table-label')[0];
        label = getText(labelNode);
        locator = "//"+labelNode.nodeName.toLowerCase()+"[(contains(@class,'wizard-form-table-label') or contains(@class,'form-table-label')) and "+
            getXPathWithLabelText(label)+"]//ancestor::table[1]//ancestor::tr[1]//"+tagName;
    }else if(!locator && e.closest('table').closest('tr').querySelectorAll('.wizard-form-table-label,.form-table-label')[0]){
        var labelNode = e.closest('table').closest('tr').querySelectorAll('.wizard-form-table-label,.form-table-label')[0];
        label = getText(labelNode);
        locator = "//"+labelNode.nodeName.toLowerCase()+"[(contains(@class,'wizard-form-table-label') or contains(@class,'form-table-label')) and "+
            getXPathWithLabelText(label)+"]//ancestor::table[1]//ancestor::tr[1]//"+tagName;
    }
    else if(!locator && e.getAttribute('class') && e.getAttribute('class')=='gwt-Label'){
        locator = "//div[@class='gwt-Label' and "+ getXPathWithLabelText(getText(e))+"]";
    }
    if(!locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(locator, e) && LocatorBuilders.findElement(locator) == e){
        locator = "("+locator+")[1]";
    }
    if(locator)
    {
        return LocatorBuilders.preciseXPath(locator,e);
    }
    return null;
}

function handleSaveSearchPattern(e: any) {
    var closestForm = e.closest('form[action]');
    if (!e.closest('#detailSave') && closestForm)
        return null;
    var formAction = closestForm.getAttribute('action');
    if (formAction) {
        formAction = formAction.substring(formAction.lastIndexOf('/'));
        var xpath = "//form[contains(@action," + LocatorBuilders.attributeValue(formAction) + ")]//" + e.tagName.toLowerCase();
        xpath = xpath + (e.name ? "[@name='" + e.name + "']" : (e.id ? "[@id='" + e.id + "']" : ""));
        if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(xpath, e))
            return xpath;
    }
    return null;
}

function id(e: any) {
    if(e.id && (IDS_TO_IGNORE.includes(e.id) || e.id.indexOf("ext-gen")>-1 || e.id.indexOf("item_sci")>-1 ||
        e.id.indexOf("header_sci")>-1 || e.id.indexOf("frButton")>-1 || IDS_TO_SKIP_RECORDING.includes(e.id))){
        return null;
    }
    if(e.nodeName.toLowerCase() == 'input' && e.getAttribute('type') == 'radio'){
        return null;
    }
    if(e.getAttribute('class') && (isHavingOneOfProvidedClassList(e, CLASSES_TO_IGNORE_IN_IDS))) {
        return null;
    }
    if (e.id && e.id != 'null') {
        if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@id='" + e.id + "']", e)) {
            if(CUSTOM_DISPLAY_NAME_IDS.includes(e.id)){
                LocatorBuilders.displayName = LocatorBuilders.getInnerTextWithoutChildren(e.closest('td').querySelectorAll('strong')[0]);
            }
            return 'id=' + e.id;
        } else if (e.innerText && e.children.length == 0) {
            //Generate XPath with id and innerText if duplicate
            var xpath = "//" + e.tagName.toLowerCase() + "[@id='" + e.id + "' and normalize-space(text())='" + e.innerText.trim() + "']";
            if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(xpath, e))
                return "xpath=" + xpath;
        }
    }
    return null;
}

function name(e: any) {
    if(e.name && (CHECK_BOX_NAMES_TO_IGNORE.includes(e.name) || NAMES_TO_IGNORE.includes(e.name))){
        return null;
    }
    if(e.nodeName.toLowerCase() == 'input' && (e.getAttribute('type') == 'radio' ||
        (e.getAttribute('type') == 'checkbox') && e.closest('tr[id=trrule]'))){
        return null;
    }
    if (e.name && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@name='" + e.name+ "' and not(@type = 'hidden')]", e))
        return 'name=' + e.name;
    return null;
}

function xpathAttrForRadioButtons(e: any) {
    let i = 0;
    let attsMap = locatorBuilders.buildAttsMap(e);
    let names : string[] = [];
    if(e.getAttribute('type') == 'radio') {
        // try preferred attributes
        let preferred_attrs = ['name','value','onclick','id']
        if(e.name && e.name.indexOf('_radio')>-1){
            preferred_attrs = ['name','value']
        }
        for (i = 0; i < preferred_attrs.length; i++) {
            let name = preferred_attrs[i]
            if (attsMap[name] != null) {
                names.push(name)
            }
        }
        var locator = locatorBuilders.attributesXPath(e,
            e.nodeName.toLowerCase(),
            names,
            attsMap, 'true')
        if(!locator && e.name && e.name.indexOf('_radio')>-1){
            var element = e.closest('tr').querySelectorAll('label[class=control_header_label]')[0];
            locator = "xpath=//*[text()[normalize-space()='"+getText(element)+"']]//ancestor::tr[1]//input[@value='"+e.value+"']";
        }
        if (e == LocatorBuilders.findElement(locator)) {
            return locator
        }
        return null;
    }
    return null;
}

function generateXPathForQuickLinks(e: any){
    var tagName = e.tagName.toLowerCase();
    if(tagName !='a' && !e.closest('.quicklinks-links')){
        return null;
    }
    var locator;
    var form = e.closest('form');
    if(form){
        locator = "xpath=//form[@name='"+form.getAttribute('name')+"']//div[contains(@class,'quicklinks-links')]//a["+getXPathWithLabelText(getText(e))+"]";
    }else{
        locator = "xpath=//div[contains(@class,'quicklinks-links')]//a["+getXPathWithLabelText(getText(e))+"]";
    }
    if (e == LocatorBuilders.findElement(locator)) {
        return locator;
    }
    return null;
}

function generateXPathForElementsWithNoIdentifiers(e: any) {
    var displayName;
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
    }//Not handling advanced search related checkboxes
    else if((e.name && (CHECK_BOX_NAMES_TO_IGNORE.includes(e.name) || NAMES_TO_IGNORE.includes(e.name))) ||
        (IDS_TO_IGNORE.includes(e.id) && e.id) ){
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
        } else {
            prevLabelElement = getPreviousTDSiblingWithLabelClass(element);
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
        displayName = labelName ? labelName.trim() : displayName;
        return 'xpath=' + locator;
    }
    return null;
}

function getCustomDisplayNameFn(e: any) {
    var tagName = e.nodeName.toLowerCase();
    var type =e.getAttribute('type');
    let parent;
    if (e.closest('.criteriaElement') && e.closest('.criteriaElement').querySelectorAll('.label').length == 1) {
        //handling display names for XRay fields
        return getText(e.closest('.criteriaElement').querySelector('.label'));
    }
    if((type == 'checkbox' || type == 'radio') && e.closest('form[name=advMembershipEntryDetailsForm],form[name=sourceTradingPartnerDetailsForm]') && !e.closest('table').querySelectorAll('.control_header_label')[0]){
        var closestTr = e.closest('table').closest('tr').previousSibling;
        var closestTd = e.closest('td').nextSibling;
        var labelTd = closestTd.nodeType == 3 ? closestTd.nextSibling : closestTd;
        var labelTr = closestTr.nodeType == 3 ? closestTr.previousSibling : closestTr;
        var headerLabel = labelTr.querySelectorAll('.menu_inner_pane_header')[0] ? getText(labelTr.querySelectorAll('.menu_inner_pane_header')[0]) : undefined;
        return headerLabel + '_' + getText(labelTd);
    }
    if(tagName == 'img' && e.getAttribute('src') && e.getAttribute('src').indexOf('image')>-1 ){
        if(e.getAttribute('src').indexOf('bt_next')>-1) return 'Next';
        if(e.getAttribute('src').indexOf('bt_search')>-1) return 'Search';
        if(e.getAttribute('src').indexOf('bt_back')>-1) return 'Back';
    }
    if(e.name && e.nodeName.toLowerCase() == 'select' && e.name.indexOf('Drop')>-1){
        var xpathForLabel = "//select[@name='"+e.name+"']//option[text()[normalize-space()='Starts With']]"+LABEL_DROP_XPATH;
        var labelEle = LocatorBuilders.findElement(xpathForLabel);
        return labelEle ? getText(labelEle) : undefined;
    }
    //The advance search fields needs constant descriptions such as quick search
    if(e.id && IDS_TO_IGNORE.includes(e.id)){
        if(e.id =='quickSearchKey'){
            return 'Field';
        }
        if(e.id =='quickSearchOperator'){
            return 'Operator';
        }
    }if(e.id == 'quickSearchValue'){
        return 'value';
    }
    // Returning the value incase of buttons
    if(tagName == 'input' && type && (type.toLowerCase() == 'button' || type.toLowerCase() == 'submit')){
        return e.getAttribute('value');
    }
    //Handle display name for GP->Metric Builder->Nominal Section
    if (e.closest('table#nominal_1')) {
        var closestTr = e.closest('tr');
        if (e.closest('td').querySelector('label.label')) {
            var labelEl, parentRadioLabel;
            if (tagName == 'input' && type && type.toLowerCase() == 'radio') {
                labelEl = e.nextElementSibling;
                parentRadioLabel = getText(closestTr.querySelectorAll('label.label,.control_header_label')[0]);
            } else if (tagName == 'input' || tagName == 'select')
                labelEl = e.previousElementSibling ? e.previousElementSibling : e.parentNode.previousElementSibling;
            if (labelEl && labelEl.tagName.toLowerCase() == 'label')
                return (parentRadioLabel ? parentRadioLabel.replace(':', '') + '_' : '') + getText(labelEl);
        } else if (closestTr.previousElementSibling && (tagName == 'input' || tagName == 'select')) {
            var indexOfEl = Array.from(closestTr.querySelectorAll('input,select')).indexOf(e);
            var labelEls = closestTr.previousElementSibling.querySelectorAll('label.label,.control_header_label');
            if (labelEls.length > indexOfEl)
                return getText(labelEls[indexOfEl]);
            else if (e.name)
                return e.name.trim();
        }
    }
    //Handling radio buttons specific to Validation sets page as the descriptions are not in the same pattern as other pages
    if(tagName == 'input' && type && type=='radio' && e.name.indexOf('_radio')>-1) {
        var xpathForRadio = xpathAttrForRadioButtons(e);
        if (xpathForRadio) {
            xpathForRadio = xpathForRadio.split('xpath=')[1];
            var xpathForRadioLabel = xpathForRadio+ "//ancestor::tr[1]//*[contains(@class,'control_header_label')]";
            var xpathForElementLabel = xpathForRadio+ LABEL_XPATH
            var locatorForRadioLabel = LocatorBuilders.findElement(xpathForRadioLabel);
            var locatorForElementLabel = LocatorBuilders.findElement(xpathForElementLabel);
            if(locatorForElementLabel && locatorForRadioLabel)
                return getText(locatorForElementLabel) + " - " + getText(locatorForRadioLabel);
            else if(locatorForElementLabel)
                return getText(locatorForElementLabel)
        }
    }else if(tagName == 'img' && e.closest('tr[id=trrule]')) {
        var xpathForRuleSetDescriptions = xpathAttr(e);
        if(xpathForRuleSetDescriptions && LocatorBuilders.findElement(xpathForRuleSetDescriptions+LABEL_XPATH)){
            return getText(LocatorBuilders.findElement(xpathForRuleSetDescriptions+LABEL_XPATH));
        }
    }else if(tagName == 'input' && type=='checkbox' && e.closest('tr[id=trrule]')) {
        return getText(e.closest('tr').querySelectorAll('label[class=control_header_label]')[0]);
    }
    if(tagName == 'td'){
        parent = e;
    }else{
        parent = e.closest('td');
    }

    if(!parent){
        return undefined;
    }
    var labelSelector = '';
    if(getImmediateChildrenWithSelector(parent, '.control_header_label')[0])
        labelSelector = '.control_header_label';
    else if(getImmediateChildrenWithSelector(parent, 'donotuseb')[0])
        labelSelector = 'donotuseb';
    else if(getImmediateChildrenWithSelector(parent, 'donotusestrong')[0])
        labelSelector = 'donotusestrong';
    else if(getImmediateChildrenWithSelector(parent, 'label.label')[0])
        labelSelector = 'label.label';
    else if (getImmediateChildrenWithSelector(parent, 'b')[0])
        labelSelector = 'b';
    else if (e.closest('#addHeaderContent')) {
        //handle header content like TP Locate chooser
        parent = e.closest('#addHeaderContent');
        labelSelector = 'b';
    }
    if (labelSelector) {
        //get only immediate child
        var labelEles = getImmediateChildrenWithSelector(parent, labelSelector);
        if (labelEles.length == 1)
            return LocatorBuilders.getInnerTextWithoutChildren(labelEles[0]);
        if (tagName == 'input' && (type == 'checkbox' || type == 'radio') && labelEles.length > 1) {
            var inputElsInTD = getImmediateChildrenWithSelector(parent, 'input[type=' + type + ']');
            if (labelEles.length == inputElsInTD.length) {
                var text = getText(labelEles[inputElsInTD.indexOf(e)]);
                if (text)
                    return text;
            }
        }
        if (tagName != 'td' && <HTMLElement>( <HTMLElement>labelEles[0]).parentNode == e.parentNode) {
            var labelElement = e.previousElementSibling ? e.previousElementSibling : e.nextElementSibling;
            var innerText = labelElement ? LocatorBuilders.getInnerTextWithoutChildren(labelElement) : "";
            if (labelElement && innerText)
                return innerText;
        }
    }
    //Handle display name for GP->Metric Builder->'Comment when result is' pattern
    if (!e.closest('tr').querySelector('.label,.control_header_label')) {
        var closestParentTD = e.closest('table').closest('td');
        if (closestParentTD) {
            var prevClosTD = closestParentTD.previousElementSibling;
            if (prevClosTD && prevClosTD.tagName.toLowerCase() == 'td' && isHavingOneOfProvidedClassList(prevClosTD, LABEL_CLASS_NAMES)) {
                var labelText = getText(prevClosTD);
                if(tagName == 'input' && e.getAttribute('type') == 'checkbox' && e.id &&
                    (e.id.indexOf('header_sci')>-1 || e.id.indexOf('item_sci')>-1)){
                    if(e.closest('span')){
                        return labelText + "-" + getText(e.closest('span'));
                    }else if(e.closest('td'))
                        return labelText + "-" + getText(e.closest('td'));
                }
                return getText(prevClosTD);
            }
        }
    }

    let labelNode;
    if(isHavingOneOfProvidedClassList(parent, LABEL_CLASS_NAMES)){
        labelNode = parent;
    }if(!labelNode && Array.from(parent.closest('tr').querySelectorAll("select > option")).find((option: any)=>option.label == 'Starts With')) {
        var labelXpath = "//*[@name='"+e.name+"']"+LABEL_DROP_XPATH;
        labelNode = LocatorBuilders.findElement(labelXpath);
    }
    if(!labelNode){
        labelNode = getPreviousTDSiblingWithLabelClass(parent);
    }
    if(labelNode && labelNode.textContent.trim().length == 0){
        var previousTr = e.closest('tr').previousSibling;
        var previousTrLabelNode = previousTr.nodeType == 3 ? previousTr.previousSibling : previousTr;
        labelNode = previousTrLabelNode.querySelectorAll('.control_header_label')[0];
        if(e.name && (e.name=='baseUOM' || e.name == 'cbkUOM')){
            return getText(labelNode) + " - " + e.name;
        }

    }
    var labelText = labelNode ? getText(labelNode) : '';
    //in few cases, labelNode is found, but text is empty
    if(labelNode && labelText){
        return labelText;
    } else if (tagName == 'select' || (tagName == 'input' && ['hidden', 'button', 'submit'].indexOf(type) == -1)) {
        console.log('start handling input/select fields with both label and field in same TAG');
        parent = e.parentNode;
        var parentText = LocatorBuilders.getInnerTextWithoutChildren(parent);
        //handle radio buttons where only input/select and text are part of one single parent
        if (parentText && parentText.length > 1 && parent.querySelectorAll(tagName + (type ? '[type=' + type.toLowerCase() + ']' : '')).length == 1 && parentText == parent.textContent.trim())
            return parentText;
        else if(e.closest('table') && e.closest('table').closest('tbody')) {
            var node = e.closest('table').closest('tbody');
            var labelEle = node.querySelectorAll('.control_header_label')[0];
            if (labelEle) {
                return getText(labelEle);
            }
        }
        else {
            console.log('handling multiple input/select in same TAG');
            var text =  getTextForMultipleInputsInSingleTag(e)
            if(!text && e.closest('table')){
                text = getLabelTextForInputsInPreviousTable(e.closest('table').parentNode);
            }
            return text;
        }
        //handle checkbox in next TD of parent TD eg: View All statuses checkbox
        var parentNextSibling = parent.nextElementSibling;
        var parentNextSibText = parentNextSibling ? getText(parentNextSibling) : '';
        if ((type == 'checkbox' || type == 'radio') && parent.tagName.toLowerCase() == 'td' && parentNextSibling
            && parentNextSibling.tagName.toLowerCase() == 'td' && parentNextSibText && parentNextSibText.length > 1)
            return parentNextSibText;
    }
    return undefined;
}

function getText(e: any) {
    var text = LocatorBuilders.getInnerTextWithoutChildren(e);
    if(!text){
        text = e.textContent.replace(/\u00a0/g,' ').trim();
    }
    return text;
}

function getTextForMultipleInputsInSingleTag(e: any){
    var prevSibling = e.previousSibling;
    var isPrevSiblingTextNode = prevSibling && prevSibling.nodeType == 3;
    var prevSiblingText = isPrevSiblingTextNode ? getText(prevSibling) : '';
    var nextSibling = e.nextSibling;
    var isNextSiblingTextNode = nextSibling && nextSibling.nodeType == 3;
    var nextSiblingText = isNextSiblingTextNode ? getText(nextSibling) : '';
    //Assuming if label has colon, display name would be in previous. else it would be in next
    //If previous is textNode and text is defined && if there is no previousSibling OR previous Text has colon
    if (isPrevSiblingTextNode && prevSiblingText && prevSiblingText.length > 1 && (!prevSibling.previousSibling || prevSiblingText.includes(':')))
        return prevSiblingText;
    //If next is textNode and text is defined && if there is no nextSibling OR next sibling doesn't has colon
    if (isNextSiblingTextNode && nextSiblingText && nextSiblingText.length > 1 && (!nextSibling.nextSibling || !nextSiblingText.includes(':')))
        return nextSiblingText;
}

function getLabelTextForInputsInPreviousTable(element: any){
    var prevSibling = element.previousSibling;
    var isPrevSiblingTextNode = prevSibling && prevSibling.nodeType == 3;
    var prevSiblingText = isPrevSiblingTextNode ? getText(prevSibling) : '';
    if (!prevSiblingText && prevSibling.previousSibling && getText(prevSibling.previousSibling))
        return getText(prevSibling.previousSibling);
    return prevSiblingText;
}

function getXPathWithLabelText(labelName: any) {
    return "(" + TEXT_NBSP_TO_EMPTY_TRANSLATE + "='" + labelName + "' or text()[normalize-space()='"+labelName+"'] or .//*[" + TEXT_NBSP_TO_EMPTY_TRANSLATE + "='" + labelName + "'])";
}

function getSpecificTagXPathWithLabelText(labelName: any) {
    return "(" + TEXT_NBSP_TO_EMPTY_TRANSLATE + "='" + labelName + "' or text()[normalize-space()='"+labelName+"'])";
}

function getXPathWithStartsWithLabelText(labelName: any) {
        return "starts-with(text()[normalize-space()],'"+ labelName +"') or starts-with(normalize-space(text()),'"+ labelName +"')" +
        " or starts-with(("+TEXT_NBSP_TO_EMPTY_TRANSLATE+"),'"+labelName+"')";
}

/**
 * Method to determine if provided element has one of class list
 * @returns {boolean}
 */
function isHavingOneOfProvidedClassList(e: any, classList: any) {
    return e.hasAttribute('class') && classList.some((className: string) => new RegExp('\\b'+className+'\\b', 'gi').test(e.getAttribute('class').trim()));
}

function dragDropList(e: any) {
    var recordedType: any;
    var additionalData: any;
    var sortableClass = 'ui-sortable';
    var elClass = e.getAttribute('class') || '';
    if (!e.closest('div.' + sortableClass) && elClass.indexOf(sortableClass) == -1)
        return null;
    if (!recordedType)
        recordedType = 'dragAndDropToObject';
    if (elClass.indexOf(sortableClass) > -1 && e.id && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@id='" + e.id.trim() + "']", e)
        && elClass.indexOf('connectedSortable') > -1)
        return 'id=' + e.id.trim();
    else {
        var elText = LocatorBuilders.getInnerTextWithoutChildren(e);
        if (recordedType == 'dragAndDropToObject')
            additionalData.innerText = elText;
        return "xpath=//div[contains(@class,'" + sortableClass + "')]/*[" + TEXT_NBSP_TO_SPACE_TRANSLATE + "='" + elText + "']";
    }
}

function navBar(e: any) {
    if (!e.closest('.ddMenuItem[onmouseenter*=sfhover],ul#appHeaderDropDownMenu'))
        return null;
    //handle top left most HomeIcon
    if (e.closest('a[href*=ecmlogin][href*=portalLaunch]') ||
        (e.tagName.toLowerCase() == 'a' && e.getAttribute('href') && e.getAttribute('href').indexOf('ecmlogin/portalLaunch.do') > -1)) {
        var homeLinkEl = (e.tagName.toLowerCase() == 'a') ? e : e.closest('a');
        return "id=" + homeLinkEl.getAttribute('id');
    }
    if (e.closest('#logo-contract-manager-dropdown-container')) {
        //Handle module navigation menus
        var liEl = e.closest('li');
        var idOfLiEl = liEl.getAttribute('id') || '';
        var xpath = "//*[@id='logo-contract-manager-dropdown-container']//li[contains(@class,'ddMenuItem')]";
        if (idOfLiEl == 'suiteDropDownMenuLiItem' && !liEl.parentNode.closest('li'))
            //handle Module header nav menu element
            xpath = xpath + "//td[last()]";
        else {
            //handle Navigation Module menu elements
            xpath = xpath + "/ul";
            if (e.tagName.toLowerCase() == 'a') {
                var elText = e.textContent.trim();
                var elClass = e.getAttribute('class') || '';
                //parent Module
                if (elClass.indexOf('parent') > -1 || liEl.parentNode.closest('li').querySelectorAll('a.parent').length > 1)
                    xpath = xpath + "//a[normalize-space(text())='" + elText + "']";
                else {
                    //Child Module
                    var parModuleAEl = liEl.parentNode.closest('li').querySelector('a.parent');
                    var parModuleText = parModuleAEl.textContent.trim();
                    xpath = xpath + "//a[normalize-space(text())='" + parModuleText + "' and contains(@class,'parent')]" +
                        "/following-sibling::ul//a[normalize-space(text())='" + elText + "']";
                }
            }
        }
        return "xpath=" + xpath;
    } else if (e.closest('ul#suiteDropDownMenu[style*=right]')) {
        //handle user menu
        var uiEl = e.closest('ul');
        var uiElClass = uiEl.getAttribute('style');
        if (uiElClass)
            return "xpath=//ul[@id='suiteDropDownMenu' and contains(@style,'right')]//a";
        else if (e.tagName.toLowerCase() == 'a') {
            var idOfAEl = e.getAttribute('id') || '';
            if (idOfAEl && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@id='" + idOfAEl.trim() + "']", e))
                return "id=" + idOfAEl;
            var aElXPath = "//ul[@id='suiteDropDownMenu' and contains(@style,'right')]//a[normalize-space(text())='" + e.textContent.trim() + "']";
            if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(aElXPath, e))
                return "xpath=" + aElXPath;
        }
    } else if (e.closest('ul#appHeaderDropDownMenu')) {
        //handle module headers
        xpath = "//ul[@id='appHeaderDropDownMenu']";
        var liEl = e.closest('li');
        var liClass = liEl.getAttribute('class') || '';
        if (liClass.indexOf('ddMenuItem') > -1 && !liEl.parentNode.closest('li')) {
            //handle parent module
            xpath = xpath + "//a[normalize-space(text())='" + e.textContent.trim() + "']";
        } else {
            //handle child module
            var parALi = liEl.parentNode.closest('li').querySelector('a');
            xpath = xpath + "//a[normalize-space(text())='" + parALi.textContent.trim() + "']/following-sibling::ul" +
                "//a[normalize-space(text())='" + e.textContent.trim() + "']";
        }
        return "xpath=" + xpath;
    }
    //Other common stuff, with anchor/li having ID without numbers
    var aEl = e.tagName.toLowerCase() == 'a' ? e : e.closest('a');
    var idOfaEl = aEl.getAttribute('id');
    if (idOfaEl && idOfaEl.trim().split(/\d+/).length == 1 && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@id='" + idOfaEl.trim() + "']", e))
        return "id=" + idOfaEl.trim();
    var liEl = aEl.closest('li');
    var idOfLiEl = liEl.getAttribute('id');
    if (idOfLiEl && idOfLiEl.trim().split(/\d+/).length == 1 && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes("//*[@id='" + idOfLiEl.trim() + "']", e))
        return "id=" + idOfLiEl.trim();
    else 
        return null;    
}

function getPreviousTDSiblingWithLabelClass(node: any) {
    let labelNode = node.previousSibling;
    var i=0;
    //restricting the traversing to 5 levels
    while (labelNode && i<5) {
        //Ignore textNode or comment node
        if (labelNode.nodeType == 3 || labelNode.nodeType == 8) {
            labelNode = labelNode.previousSibling;
            continue;
        }
        else
        {
            //th has label -> formulary product chooser -> options tab
            if(isHavingOneOfProvidedClassList(labelNode, LABEL_CLASS_NAMES) && (labelNode.nodeName.toLowerCase() == 'td' || labelNode.nodeName.toLowerCase() == 'th'))
            {
                return labelNode;
            }
            labelNode = labelNode.previousSibling;
        }
        i++;
    }
    return null;
}

function xpathAttr(e: any){
    var additionalData: any;
    if (e.id && IDS_TO_SKIP_RECORDING.includes(e.id))
        return null;
    var tagName = e.nodeName.toLowerCase();
    let locator;
    if(e.getAttribute('type') && e.getAttribute('type') == 'radio'){
        return null;
    }
    var closestMenuHeader= e.closest('td[class*=menu_pane_header]');
    var menu_header;
    if(closestMenuHeader) {
        if (closestMenuHeader.getAttribute('id')) {
            menu_header = "//td[@id='" +closestMenuHeader.getAttribute('id') + "']";
        }
        else {
            menu_header = "//td[@class='" + closestMenuHeader.getAttribute('class') + "']";
        }
    }
    var closestForm = e.closest('form');
    var prefAttrLocator = locatorBuilders.buildLocatorFromPreferredAttributes(e,'true');
    var userData;
    if(tagName == 'input' && e.getAttribute('type') == 'checkbox' && e.id && (e.id.indexOf('header_sci')>-1
        || e.id.indexOf('item_sci')>-1)){
        var id = e.id.indexOf('item_sci')>-1 ? 'item_sci' :  'header_sci';
        if(e.closest('span'))
            locator = "xpath=//span["+getXPathWithLabelText(getText(e.closest('span')))+"]//input[@type='checkbox' and contains(@id,'"+id+"')]";
        else if(e.closest('td') && e.getAttribute('onclick'))
            locator = "xpath=//td["+getXPathWithLabelText(getText(e.closest('td')))+"]//input[@type='checkbox' " +
                "and contains(@id,'"+id+"') and @onclick = "+ LocatorBuilders.attributeValue(e.getAttribute('onclick'))+"]";
    }
    else if(tagName == 'a' && e.getAttribute('onclick') && closestMenuHeader){
        if(e.closest('form')){
            locator = "xpath=//form[@name='"+e.closest('form').getAttribute('name')+"']" +
                "//td[@class='"+closestMenuHeader.getAttribute('class')+"']" +
                "//a["+LocatorBuilders.getXpathForAttribute('onclick',e.getAttribute('onclick'))+"]";
        }else{
            locator = "xpath=//td[@class='"+closestMenuHeader.getAttribute('class')+"']" +
                "//a["+LocatorBuilders.getXpathForAttribute('onclick',e.getAttribute('onclick'))+"]";
        }
    }
    //handle context menu items in ECMF divisions
    else if (e.closest('tr[onmouseover*=contextmenu_highlight]')) {
        LocatorBuilders.displayName = getText(e);
        locator = "xpath=//tr[contains(@onmouseover,'contextmenu_highlight') and not(ancestor::*[contains(translate(@style,' ',''),'visibility:hidden') " +
            "or contains(translate(@style,' ',''),'display:none')])]//" + tagName + "[normalize-space(text())='" + LocatorBuilders.displayName + "']";
        prefAttrLocator = null;
    }
    else if(e.getAttribute('class') &&  e.getAttribute('class').indexOf('truncatedBreadCrumbWidth') >-1){
        locator = "xpath=//div[contains(@class,'truncatedBreadCrumbWidth') and @title= '"+e.getAttribute('title')+"']"
        LocatorBuilders.displayName = e.getAttribute('title');
    }
    else if(tagName == 'input' && e.getAttribute('type') == 'checkbox' && e.closest('tr[id=trrule]')){
        locator = "xpath=//label[contains(@class,'control_header_label')]//" +
            "text()[normalize-space()='"+getText(e.closest('tr').querySelectorAll('label[class=control_header_label]')[0])+"']" +
            "//ancestor::tr[1]//input[@type='checkbox']";
    }
    else if(e.id && e.id == 'quickSearchValue' && e.getAttribute('onkeypress')){
        locator = "xpath=(//"+ tagName + "[@onkeypress='"+e.getAttribute('onkeypress')+"'])";
    }
    //The go to page under grid needs exclusive handling
    else if(e.getAttribute('onclick') && e.getAttribute('onclick').indexOf('jumpToItemPage1')>-1){
        if(e.closest("div[id]")){
            locator = "xpath=//div[@id='" + (e.closest("div[id]")).getAttribute('id') + "']//"+tagName+"[contains(@onclick,'jumpToItemPage1')]";
        }else {
            locator = 'xpath=(//' + tagName + '[contains(@onclick,"jumpToItemPage1")])';
        }
    }
    else if(e.getAttribute('onclick') && e.getAttribute('onclick').indexOf('jumpToItemPage2')>-1){
        if(e.closest("div[id]")){
            locator = "xpath=//div[@id='" + (e.closest("div[id]")).getAttribute('id') + "']//"+tagName+"[contains(@onclick,'jumpToItemPage2')]";
        }
        else {
            locator = 'xpath=(//' + tagName + '[contains(@onclick,"jumpToItemPage2")])';
        }
    }else if(e.id.indexOf('selectPage')>-1){
        if(e.closest("div[id]")){
            locator = "xpath=//div[@id='" + (e.closest("div[id]")).getAttribute('id') + "']//"+tagName+"[contains(@id,'"+e.id+"')]";
        }
        else {
            locator = "xpath=(//" + tagName + "[contains(@id,'"+e.id+"')])";
        }
    }
    else if(tagName == 'donotusestrong' && e.closest('span') && e.closest('span').getAttribute('onclick')){
        locator = "xpath=//span[@onclick="+LocatorBuilders.attributeValue(e.closest('span').getAttribute('onclick'))+" and not(contains(translate(@style,' ',''),'visibility:hidden')" +
            " or contains(translate(@style,' ',''),'display:none')) and not(ancestor::*[contains(translate(@style,' ',''),'visibility:hidden') " +
            "or contains(translate(@style,' ',''),'display:none')])]//donotusestrong";
    } else if (tagName == 'img' && e.hasAttribute('src') && e.getAttribute('src').endsWith('/i_check.gif') && e.closest('td')
        && e.closest('td').querySelectorAll('input[type=hidden][name]').length == 1) {
        //handle tick image in few pages like AMM
        var hiddenInputName = e.closest('td').querySelectorAll('input[type=hidden][name]')[0].getAttribute('name');
        locator = "xpath=//input[@type='hidden' and @name='" + hiddenInputName + "']/ancestor::td[1]//img[contains(@src,'i_check.gif')]";
        LocatorBuilders.displayName = getText(e.closest('td').nextElementSibling);
    } else if (e.closest('.criteriaElement') && !e.id) {
        var closestDivWithID = e.closest('div.criteriaContainer[id]');
        var divID = closestDivWithID.getAttribute('id');
        if (closestDivWithID.querySelectorAll('.criteriaElement').length == 1) {
            locator = "xpath=//div[@id='" + divID + "']//div[@class='criteriaElement']//" + tagName + (e.hasAttribute('class') ? "[@class='" + e.getAttribute('class') + "']" : "");
            LocatorBuilders.displayName = getText(closestDivWithID.querySelectorAll('.criteriaTitle')[0]);
        }
    }
    //All grid actions should be relative to the form as there can be multiples searches
    else if(tagName == 'span' && e.getAttribute("class") &&
        e.getAttribute("class").indexOf('header_icon_info')>-1 && e.closest('a') &&
        (e.closest('a').getAttribute('href') || e.closest('a').getAttribute('onclick'))){
        //There are duplicates in the same page for search when the search is already applied.Getting the closest menu_header class in such cases
        if(e.closest('form')) {
            var formName = e.closest('form').getAttribute('name');
            var formAction = e.closest('form').getAttribute('action');
            locator = locatorBuilders.buildLocatorFromPreferredAttributes(e.closest('a'),'true');
            //In case of duplicates, locator is null
            if(!locator){
                locator = getCustomXpathForGridActions(e);
            }
            if(formAction){
                if(menu_header){
                    locator = "xpath=//form[@action='" + formAction + "']" + menu_header + locator?.split('xpath=')[1] + "//span";
                }else {
                    locator = "xpath=//form[@action='" + formAction + "']" + locator?.split('xpath=')[1] + "//span";
                }
            }else {
                if(menu_header){
                    locator = "xpath=//form[@name='" + formName + "']" + menu_header +  locator?.split('xpath=')[1] + "//span";
                }else {
                    locator = "xpath=//form[@name='" + formName + "']" + locator?.split('xpath=')[1] + "//span";
                }
            }
        }
        else{
            if(e.closest('a') && e.closest('a').getAttribute('href') && e.closest('a').getAttribute('href').indexOf('	')>-1){
                locator = "//a[normalize-space(translate(@href,'	',' '))=normalize-space("+LocatorBuilders.attributeValue(e.closest('a').getAttribute('href')).replace('	', ' ') +")]"
            }else {
                locator = locatorBuilders.buildLocatorFromPreferredAttributes(e.closest('a'), 'true');
            }
            //In case of duplicates locator is null
            if(!locator) {
                locator = getCustomXpathForGridActions(e);
            }
            if(menu_header){
                locator = "xpath="+menu_header + locator?.split('xpath=')[1]+"//span";
            }else{
                locator = locator + "//span";
            }
        }
        //Handle display name where anchor has title but not span element
        if (!e.hasAttribute('title') && e.closest('a').hasAttribute('title') && !LocatorBuilders.displayName) {
            LocatorBuilders.displayName = e.closest('a').getAttribute('title');
        }
    } else if (tagName != 'button' && e.closest('button[onclick*=ShowDropdown]')) {
        var button = e.closest('button');
        var buttonLocator = locatorBuilders.buildLocatorFromPreferredAttributes(button, 'true');
        prefAttrLocator = buttonLocator + "//" + tagName;
        LocatorBuilders.displayName = getText(button);
        var closesetDivHavingID = e.closest("div[id]:not([id=qsrch_form])");
        if (closesetDivHavingID)
            locator = "xpath=//div[@id='" + closesetDivHavingID.getAttribute('id') + "']" + prefAttrLocator.split('xpath=')[1];
    }//All advanced search buttons and checkboxes should be relative to the form as there can be multiples searches
    else if(prefAttrLocator && (BUTTON_IDS_TO_IGNORE.includes(e.id) || CHECK_BOX_NAMES_TO_IGNORE.includes(e.name))){
        var formAction = e.closest('form').getAttribute('action');
        locator = "xpath=//form[@action='" + formAction + "']" + prefAttrLocator.split('xpath=')[1];
    }else if(prefAttrLocator && e.closest("div[id]:not([id=qsrch_form])")){
        if(tagName == 'img' && e.getAttribute('onclick') && e.getAttribute('onclick').startsWith('clearSelectedEntity')) {
            var closestTr = e.closest('tr');
            if(closestTr && closestTr.querySelectorAll('input[value]')[0]){
                userData = closestTr.querySelectorAll('input[value]')[0].value;
            }
        }
        locator = "xpath=//div[@id='" + (e.closest("div[id]:not([id=qsrch_form])")).getAttribute('id') + "']" + prefAttrLocator.split('xpath=')[1];
    }else if(prefAttrLocator && menu_header){
        locator = "xpath="+menu_header + prefAttrLocator.split('xpath=')[1];
    }else if(prefAttrLocator && closestForm){
        locator = "xpath=//form[@name='" + closestForm.getAttribute('name') + "']" + prefAttrLocator.split('xpath=')[1];
    }
    if(!locator && prefAttrLocator){
        locator = prefAttrLocator;
    }
    //added below case if prefAttrLocator is with precise xpath like (//input[@value='Filter'])[2]
    if (locator && prefAttrLocator && locator != prefAttrLocator && prefAttrLocator.startsWith('xpath=(')) {
        var preLocator = locator.split(prefAttrLocator.split('xpath=')[1])[0];
        locator = "xpath=(" + preLocator.split('xpath=')[1] + prefAttrLocator.split('xpath=(')[1];
    }
    if(userData){
        additionalData.innerText = userData;
    }
    if (locator && e == LocatorBuilders.findElement(locator)) {
        if (!LocatorBuilders.displayName) {
            LocatorBuilders.displayName = e.textContent ? e.textContent.trim() : '';
        }
        return locator;
    }else if(prefAttrLocator && e == LocatorBuilders.findElement(prefAttrLocator)){
        return prefAttrLocator;
    }
    return null;
}

/**
 * Customize the grid actions basic xpath when the locator is duplicate in  buildLocatorFromPreferredAttributes
 */
function getCustomXpathForGridActions(e: any){
    var onclickAttr = e.closest('a').getAttribute('onclick');
    var hrefAttr = e.closest('a').getAttribute('href');
    if(onclickAttr)
        return 'xpath=//a['+LocatorBuilders.getXpathForAttribute('onclick',onclickAttr)+']';
    else if(hrefAttr)
        return 'xpath=//a['+ LocatorBuilders.getXpathForAttribute('href',hrefAttr) +']';
    return;    
}

/**
 * Method to handle Success / Error messages locator builder on top
 */
function handleSuccessErrorMessagesPattern(e: any) {
    var recordedType: any;
    var additionalData: any;
    var closestTable = e.closest('table#tbl-error-box,table#tbl-success-box,table#tbl-warning-box');
    if (!closestTable)
        return null;
    var tableId = (closestTable.id || '').trim();
    var displayName = tableId == 'tbl-error-box' ? 'Error' : (tableId == 'tbl-success-box' ? 'Success' : 'Warning');
    var validTagNames = ['li', 'span', 'label', 'id', 'ul'];
    if (validTagNames.indexOf(e.tagName.toLowerCase()) > -1) {
        console.log('inside handle Success / Error Message');
        //Replacing multiple subsequent spaces with 1 space, using only here not to have regressions
        var innerText = LocatorBuilders.getInnerTextWithoutChildren(e).replace(/[ ]{2,}/g,' ');
        //in few success messages, error message has test
        var regex = new RegExp("'(.*?)'",'g');
        var innerTexts='';
        var match;
        while (match = regex.exec(innerText)) {
            innerTexts = (innerTexts ? innerTexts + '->' : '') + match[0].replace(/'/g,'');
        }
        //only in case of errors we can consider as locatorHavingData.
        if (!recordedType && (tableId == 'tbl-error-box' || innerTexts)) {
            recordedType = 'locatorHavingData';
            additionalData.innerText = tableId == 'tbl-error-box' ? innerText : innerTexts;
        }
        if(!displayName)
            displayName = displayName;
        var localNameXpath = "(";
        for (var i = 0; i < validTagNames.length ; i++) {
            localNameXpath = localNameXpath + "local-name()='" + validTagNames[i] + "'" + (i != validTagNames.length - 1 ? " or " : "");
        }
        localNameXpath = localNameXpath + ")";
        var fullXpath = "xpath=//*[@id='" + tableId + "']//"+e.tagName.toLowerCase()+"[" + localNameXpath + " and " +
            TEXT_NBSP_TO_SPACE_TRANSLATE + "=" + LocatorBuilders.attributeValue(innerText) + " or normalize-space(.) = "+ LocatorBuilders.attributeValue(innerText) +"]";
        return LocatorBuilders.findElement(fullXpath) ? fullXpath : "xpath=//*[@id='" + tableId + "']//*[" + localNameXpath + "]";
    } else if (e.closest('td.error-box-label')) {
        console.log('inside handle Error Message label');
        if(!displayName)
            displayName = displayName;
        return "xpath=//*[@id='" + tableId + "']//td[@class='error-box-label']";
    } else if (e.closest('td.success-box-icon') && e.tagName.toLowerCase() == 'img') {
        if(!displayName)
            displayName = displayName;
        return "xpath=//*[@id='" + tableId + "']//td[@class='success-box-icon']/img";
    } else if (e.id && e.tagName.toLowerCase() == 'td') {
        if(!displayName)
            displayName = displayName;
        return "xpath=//*[@id='" + tableId + "']//td[@id='"+e.id+"']";
    }
    return null;
}

/**
 * Method to handle SUBMISSION TEMPLATE LIST->EDIT PRICING TEMPLATE fields in form SubmissionFileTemplateForm
 */
function handleGPSubmissionFileTemplateFormFields(e: any) {
    var recordedType: any;
    var additionalData: any;
    if (!e.closest('form[name=SubmissionFileTemplateForm]'))
        return null;
    var prevColNameEl = window.document.evaluate("./preceding::input[@type='hidden' and @name='columnId'][1]/ancestor::span[contains(@class,'control_header_label')]", e.closest('tr')).iterateNext();
    if (!prevColNameEl)
        return null;
    var prevLabelElement = getPreviousTDSiblingWithLabelClass(e.closest('td'));
    if (!prevLabelElement)
        return null;
    console.log('inside handle SUBMISSION TEMPLATE LIST->EDIT PRICING TEMPLATE fields');
    var colNameText = LocatorBuilders.getInnerTextWithoutChildren(prevColNameEl);
    var labelText = LocatorBuilders.getInnerTextWithoutChildren(prevLabelElement);
    var xpath = "//form[@name='SubmissionFileTemplateForm']//td/span[normalize-space(text())='" + colNameText + "']" +
        "/following::td[@class='control_header_label' and starts-with(normalize-space(text()),'" + labelText + "')]" +
        "/following::td[1]/" + e.tagName.toLowerCase();
    //RTS-7294
    if(e.type=="radio"){
        console.log('input type is radio');
        xpath += "[@value='" + e.value + "']"
    }
    if (!recordedType) {
        recordedType = 'locatorHavingData';
        additionalData.innerText = colNameText;
    }
    var nameAttr = e.getAttribute('name');
    if (nameAttr && e.type != 'radio')
        xpath = xpath + "[@name='" + nameAttr + "']";
    return "xpath=" + xpath;
}

/**
 * Method to handle Left Navigation pattern
 */
function handleLeftNavPattern(e: any) {
    var recordedType: any;
    var additionalData: any;
    var displayName: any;
    if (!e.closest('td#left_panel,td.gp_selector_item,td.gp_selector_item_h'))
        return null;
    if (e.closest('td[class*=gp_selector_item]')) {
        if (e.tagName.toLowerCase() == 'a') {
            //handle left panel in GP Metrics->Attributes tab
            console.log('Inside left panel in GP Metrics->Attributes tab');
            var innerText = LocatorBuilders.getInnerTextWithoutChildren(e);
            var xpath = "//td[contains(@class,'gp_selector_item')]//a[normalize-space(.)='" + innerText + "']";
            if (!recordedType) {
                recordedType = 'leftNav';
                additionalData.navLinks = innerText;
            }
            return "xpath=" + xpath;
        }
    } else if (e.closest('td#hm_tree_toolbar')) {
        console.log('Inside expand/collapse all');
        var anchorEl = e.closest('a[href]');
        var hrefAttr = anchorEl.getAttribute('href');
        return "xpath=//*[@id='hm_tree_toolbar']//a[" + LocatorBuilders.getXpathForAttribute('href', hrefAttr) + "']";
    } else if (e.closest('td#nodesParent')) {
        console.log('Inside left navs');
        var folderSelector = 'img[id$=closedfolder][src*=icon_folder],img[id$=openfolder][src*=icon_folder],' +
            'img[id$=_minus][src*=mmiddle],img[id$=_plus][src*=pmiddle],img[id$=_plus][src*=plast],img[id$=_minus][src*=mlast]';
        var closestTr = e.closest('tr');
        var displayName;
        var isCollapseBtn = e.closest('td').querySelector('[id$=_plus],[id$=_minus]') != null;
        var textEl = e;
        if (isCollapseBtn)
            textEl = closestTr.querySelector('a[name=hmForSelection],span[name=hmForSelection]');
        var links = '', dynamicLinks: string[] = [];
        var currText = LocatorBuilders.getInnerTextWithoutChildren(textEl);
        links = currText + '->' + links;
        if (closestTr.querySelectorAll(folderSelector)[0])
            dynamicLinks.push(currText);
        var currentTable = e.closest('table[id$=table]');
        //store #TDs to determine the level
        var tdLength = e.closest('table').querySelectorAll('tr > td').length;
        var elXpath = "td[" + tdLength + "]/*[@name='hmForSelection' and normalize-space(text())='" + currText + "']";
        if (isCollapseBtn) {
            elXpath = elXpath + "/ancestor::tr[1]//img[(contains(@id,'_plus') or contains(@id,'_minus')) and not(contains(@style,'none'))]";
            displayName = 'expand/collapse button next to ' + currText;
        }
        while (currentTable != null) {
            var anchorEl = currentTable.querySelector('a[name=hmForSelection],span[name=hmForSelection]');
            if (anchorEl != null && anchorEl.closest('table').querySelectorAll('tr > td').length < tdLength) {
                currText = LocatorBuilders.getInnerTextWithoutChildren(anchorEl);
                links = currText + '->' + links;
                if (anchorEl.closest('tr').querySelectorAll(folderSelector)[0])
                    dynamicLinks.push(currText);
                tdLength--;
                elXpath = "td[" + tdLength + "]/*[@name='hmForSelection' and normalize-space(text())='" + currText + "']" + "//following::table//" + elXpath;
            }
            currentTable = currentTable.previousElementSibling;
        }
        if (dynamicLinks.length >= 2 && !recordedType) {
            recordedType = 'leftNav';
            var navLinks = '';
            //Ignore last element
            for (var k = 0; k < dynamicLinks.length - 1; k++) {
                navLinks = dynamicLinks[k] + (navLinks == '' ? '' : '->' + navLinks);
            }
            additionalData.navLinks = navLinks;
            if (displayName)
                displayName = displayName;
        }
        return "xpath=//td[@id='nodesParent']//" + elXpath;
    }
    return null;
}

/**
 * Method to handle Field sets in DOMAIN TABLE LIST->ADD DOMAIN TABLE pattern
 */
function handleFieldSetMovePattern(e: any) {
    var recordedType: any;
    var additionalData: any;
    var elTag = e.tagName.toLowerCase();
    var elSrc = e.getAttribute('src') || '';
    var elClass = e.getAttribute('class') || '';
    var fieldSetEl = e.closest('fieldset.x-fieldset');
    if (!fieldSetEl && !(e.closest('form.x-form') && elTag == 'img' && elSrc.indexOf('.gif') > -1))
        return null;
    console.log('inside handle DOMAIN TABLE LIST->ADD DOMAIN TABLE fields');
    if (elTag == 'img') {
        //handle left and right images for selection
        console.log('handle left/right images in center');
        return "xpath=//form[contains(@class,'x-form')]//img[@src='" + elSrc + "']";
    } else if (fieldSetEl && elTag == 'button') {
        console.log('handle move/clear all buttons on top');
        var buttonText = LocatorBuilders.getInnerTextWithoutChildren(e);
        return "xpath=//fieldset[contains(@class,'x-fieldset')]//button[normalize-space(text())='" + buttonText + "']";
    } else if (fieldSetEl && elTag == 'div' && elClass.indexOf('ux-mselect-item') > -1) {
        console.log('handle selecting items');
        var legendSpanEl = fieldSetEl.querySelector('legend span.x-fieldset-header-text');
        var legendText = LocatorBuilders.getInnerTextWithoutChildren(legendSpanEl);
        var elInnerText = LocatorBuilders.getInnerTextWithoutChildren(e);
        if (!recordedType) {
            recordedType = 'locatorHavingData';
            additionalData.innerText = elInnerText;
        }
        return "xpath=//fieldset[contains(@class,'x-fieldset') and ./legend/span[contains(text(),'" + legendText + "')]]" +
            "//div[normalize-space(text())='" + elInnerText + "']";
    }
    return null;
}

/**
 * Method to handle GP PUBLISHING SETTINGS
 */
function handleGPPublishSettingsPattern(e: any) {
    var displayName : any;
    if (!e.closest('form[name=publishingSettingsActionForm]'))
        return null;
    var elTag = e.tagName.toLowerCase();
    if (['input','select'].indexOf(elTag) == -1)
        return null;
    console.log('inside handle GP PUBLISHING SETTINGS fields');
    var trEl = e.closest('tr');
    var tdEl = trEl.querySelector('td.control_header_label');
    var labelText = LocatorBuilders.getInnerTextWithoutChildren(tdEl);
    var elXPath = "//form[@name='publishingSettingsActionForm']//td[@class='control_header_label' and starts-with(normalize-space(text()),'" + labelText + "')]" +
        "/ancestor::tr[1]//" + elTag + (e.name ? "[@name='" + e.name + "']" : "");
    displayName = labelText.replace(':', '');
    var closestTable = e.closest('table');
    var headerLabelTR: any = window.document.evaluate(".//tr[not(@colspan)]/td[@class='control_header_label' and string-length(normalize-space(text()))>1]/ancestor::tr[1]",
        closestTable, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
    if (headerLabelTR) {
        var tdIdx = Array.from(trEl.querySelectorAll('td')).indexOf(e.closest('td'));
        var headerTDs = headerLabelTR.querySelectorAll('td');
        if (headerTDs.length > tdIdx)
            displayName = displayName + '_' + LocatorBuilders.getInnerTextWithoutChildren(headerTDs[tdIdx]);
    }
    return elXPath;
}

/**
 * Method to handle Detail page menu inner pane header links with class name menu_inner_pane_header
 */
function handleMenuInnerPaneHeadersPattern(e: any) {
    if (!e.closest('.menu_inner_pane_header'))
        return null;
    var anchorEl = e.closest('a[href]');
    if (!anchorEl || !anchorEl.closest('.menu_inner_pane_header'))
        return null;
    var href = anchorEl.getAttribute('href');
    return "xpath=//*[@class='menu_inner_pane_header']//a[" + LocatorBuilders.getXpathForAttribute('href', href) + "']/div";
}

function handleGPFormulaEvaluateSection(e: any) {
    var tagName = e.tagName.toLowerCase();
    var elId = e.id ? e.id.trim() : '';
    var closestTR = e.closest('tr');
    if (e.closest('table.evaluationTable') && closestTR) {
        if (tagName == 'td' && closestTR.querySelectorAll('.result')[0]) {
            LocatorBuilders.displayName = closestTR.querySelectorAll('.result')[0].textContent.trim();
            return "xpath=//table[contains(@id,'formula-expression-verify')]//td[contains(@class,'result')]/ancestor::tr[1]/td[2]";
        } else if (tagName == 'input' && closestTR.querySelectorAll('.description')[0]) {
            var innerText = closestTR.querySelectorAll('.description')[0].textContent.trim().replace(':','');
            LocatorBuilders.displayName = innerText;
            LocatorBuilders.recordedType = 'locatorHavingData';
            LocatorBuilders.additionalData.innerText = innerText;
            return "xpath=//table[contains(@id,'formula-expression-verify')]//td[contains(@class,'description') and starts-with(normalize-space(.),concat('" + innerText + "',':'))]" +
                "/ancestor::tr[1]//input[@type='text']";
        }
    } else if ((tagName == 'button' && elId == 'evaluateFormulaExpression') || (tagName == 'span' && e.closest('button#evaluateFormulaExpression'))) {
        LocatorBuilders.displayName = (tagName == 'button' ? e : e.closest('button#evaluateFormulaExpression')).textContent.trim();
        if (tagName == 'button')
            return 'id=evaluateFormulaExpression';
        else
            return "xpath=//div[contains(@id,'formula-expression-verify')]//button[@id='evaluateFormulaExpression']/span";
    }
    return null;
}

/**
 * Method to handle GP Formula validation related Images in Metric list/FSS Price Type
 * @param e
 */
function handleGPFormulaValidationImages(e: any) {
    if (e.closest('div[id*=formula-expression-verify]'))
        return handleGPFormulaEvaluateSection(e);
    if (!e.closest('#validationTblTbody,.validationTable'))
        return null;
    //Handle only Images
    if (e.tagName.toLowerCase() != 'img' && !e.hasAttribute('src'))
        return null;
    var labelTd = e.closest('tr').querySelector('td.summary,td.description');
    if (!labelTd)
        return null;
    var labelTdClass = labelTd.getAttribute('class') || '';
    var isSummary = labelTdClass.includes('summary');
    var labelName = getText(labelTd);
    var xpath = "//*[@id='validationTblTbody' or contains(@class,'validationTable')]";
    if (isSummary) {
        xpath = xpath + "//td[@class='summary' and (normalize-space(.)='" + labelName + "' or ./*[normalize-space(text())='" + labelName + "'])]";
    } else {
        xpath = xpath + "//td[@class='description' and (normalize-space(.)='" + labelName + "' or ./*[normalize-space(text())='" + labelName + "'])]/ancestor::tr[1]/td";
    }
    var imageSrc = e.getAttribute('src');
    imageSrc = imageSrc.substring(imageSrc.lastIndexOf('/') + 1, imageSrc.lastIndexOf('.'));
    xpath = xpath + "//img[contains(@src,'" + imageSrc + "')]";
    return "xpath=" + xpath;
}

/**
 * Method to handle GP Price Status Change Action Dialog Apply To field
 * @param e
 */
function handleGPPriceStatusChangeAction(e: any) {
    var recordedType: any;
    var additionalData: any;
    if (!e.closest('form[name=priceStatusChangeActionForm]'))
        return null;
    var closestTD = e.closest('td');
    if (closestTD && !(closestTD.previousElementSibling || isHavingOneOfProvidedClassList(closestTD.previousElementSibling, LABEL_CLASS_NAMES)))
        return null;
    var closestTR = e.closest('tr');
    //Replace any extra spaces in between to single space
    var trInnerText = closestTR.textContent.replace(/[\s]{2,}/g,' ').replace(/\u00a0/g, ' ').trim();
    if (!trInnerText)
        return null;
    console.log('Inside handling GP Price Status Change Dialog:' + trInnerText);
    var prevLabelElement = getPreviousTDSiblingWithLabelClass(closestTR.closest('td'));
    if (!prevLabelElement)
        return null;
    var labelText = LocatorBuilders.getInnerTextWithoutChildren(prevLabelElement);
    var xpath = "//form[@name='priceStatusChangeActionForm']//td[@class='control_header_label' and " + getXPathWithLabelText(labelText) + "')]" +
        "/following::td[1]//tr[normalize-space(translate(.,'\\u00a0',' '))=normalize-space('" + trInnerText + "')]";
    if (!recordedType) {
        recordedType = 'locatorHavingData';
        additionalData.innerText = trInnerText;
    }
    return "xpath=" + xpath;
}

/**
 * Method to handle GP importActionForm table fields
 * @param e
 */
function handleGPImportActionForm(e: any) {
    var recordedType: any;
    var additionalData: any;
    if (!e.closest('form[action="/gp/importAction.do?operation=goBackToMapping"]'))
        return null;
    console.log('inside handling GP Import Action Error page');
    var closestTableTr = e.closest('tr.tblcolmtitle,tr.tblrow,tr.tblaltrow');
    var xpath = "//form[@name='importActionForm']";
    var labelText, innerText;
    var elClass = e.getAttribute('class') || '';
    if (closestTableTr) {
        if (elClass.includes('control_header_label')) {
            //handle 1st column in the table
            console.log('handling first column in error table');
            labelText = LocatorBuilders.getInnerTextWithoutChildren(e);
            xpath = xpath + "//td[@class='control_header_label' and normalize-space(text())='" + labelText + "']";
        } else {
            console.log('handling Errors column in table');
            //Handle errors inside table
            var closestParentTD = e.closest('table').closest('td');
            var labelTDEl = getPreviousTDSiblingWithLabelClass(closestParentTD);
            labelText = LocatorBuilders.getInnerTextWithoutChildren(labelTDEl);
            xpath = xpath + "//td[@class='control_header_label' and normalize-space(text())='" + labelText + "']/following-sibling::td";
            innerText = e.textContent.replace(/[\s]{2,}/g,' ').replace(/\u00a0/g, ' ').trim();
            xpath = xpath + "//td[normalize-space(text())='" + innerText + "']";
        }
    } else {
        console.log('handling summary records at the top');
        //handle summary records at the top
        innerText = e.textContent.replace(/[\s]{2,}/g,' ').replace(/\u00a0/g, ' ').trim();
        xpath = xpath + "//td[@class='control_header_label' and normalize-space(text())='" + innerText + "']";
    }
    if (!recordedType) {
        recordedType = 'locatorHavingData';
        additionalData.innerText = (labelText ? labelText : '') + (labelText && innerText ? '->' : '') + (innerText ? innerText : '');
    }
    return xpath;
}

/**
 * Method to handle content editable formula field pattern
 * @param e
 */
function handleContentEditableFieldRecording(e: any) {
    var elClass = e.getAttribute('class') || '';
    if (!e.closest('body.editbox') && !(e.tagName.toLowerCase() == 'body' && elClass.includes('editbox')))
        return null;
    //Considering only body tag instead of child elements as the formula is split across multiple tags
    return "xpath=//body[contains(@class,'editbox') and not(contains(translate(@style,' ',''),'visibility:hidden') or contains(translate(@style,' ',''),'display:none')) " +
        "and not(ancestor::*[contains(translate(@style,' ',''),'visibility:hidden') or contains(translate(@style,' ',''),'display:none')])]"
}


function isElementFoundByLocatorNotMatchedEligibleForRecordingCustom(origEl: any, newlyFoundEl: any) {
    var isElementMatchedWithBuiltLocator = (origEl == newlyFoundEl);
    if (!isElementMatchedWithBuiltLocator && (origEl.getAttribute('onchange') || origEl.closest('div.pickListMenuBody,div.windowBody,div.windowHeader')))
        isElementMatchedWithBuiltLocator = true;
    console.log('custom Flex isElementFoundByLocatorNotMatchedEligibleForRecording returning value:' + isElementMatchedWithBuiltLocator);
    return isElementMatchedWithBuiltLocator;
}

function isElementEligibleForRecordingCustom(e: any) {
    console.log('custom Flex isElementEligibleForRecording');
    //Ignore actions on scroll bar in GWT pages
    var eventProxyAttr = e.hasAttribute('eventproxy') ? e.getAttribute('eventproxy') : '';
    var isScrollImageEl = e.tagName.toLowerCase() == 'img' && e.hasAttribute('src') && e.getAttribute('src').toLowerCase().includes('/scrollbar/');
    var isScrollEl = eventProxyAttr && (eventProxyAttr.includes('scroll') || eventProxyAttr.substring(0, eventProxyAttr.length-1).endsWith('Grid_'));
    return !isScrollImageEl && !isScrollEl;
}

/**
 * Method to go with innerText or anything related to innerText
 * @param e
 */
function xpathInnerText(e: any) {
    if (!e.innerText)
        return null;
    var elClass = e.getAttribute('class') || '';
    //ignore all menu pane header having below class
    if (elClass.indexOf('menu_pane_header') > -1)
        return null;
    var isXPathUnique = function(inXPath: any, displayName: any) {
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

/**
 * Method to handle GWT Table dropdown picklist
 * @param e
 */
function handleGWTPickList(e: any) {
    var elClass = e.getAttribute('class') || '';
    var elTag = e.tagName.toLowerCase();
    var srcAttr = elTag == 'img' ? e.getAttribute('src'): '';
    var elXPath, displayName;
    var innerText = getText(e);
    if (e.closest('div.pickListMenuBody') && innerText && innerText.length > 1) {
        console.log('Inside pickListMenu Item');
        var pickListMenuXPath = "//div[@class='pickListMenuBody']//" + elTag +
            "[normalize-space(text())='" + innerText + "' or normalize-space(.)='" + innerText + "']";
        if (locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(pickListMenuXPath, e)) {
            LocatorBuilders.recordedType = 'locatorHavingData';
            LocatorBuilders.additionalData.innerText = innerText;
            if (!LocatorBuilders.displayName)
            LocatorBuilders.displayName = innerText;
            return pickListMenuXPath;
        }
    } else if (e.closest('div.windowBody')) {
        console.log('Inside GWT window body');
        var windowBodyXPath = "//div[@class='windowBody' and not(ancestor::*[contains(@style,'visibility: hidden')])]";
        if (elTag == 'input' && (elClass == 'textItem' || elClass == 'textItemFocused')) {
            elXPath = windowBodyXPath + "//input[@class='textItem' or @class='textItemFocused']";
        } else if (elTag == 'td' && (elClass == 'buttonTitle' || elClass == 'buttonTitleOver'))
            elXPath = windowBodyXPath + "//td[@class='buttonTitle' or @class='buttonTitleOver']";
        else if (elTag == 'div' && (elClass == 'selectItemText' || elClass == 'selectItemTextFocused'))
            elXPath = windowBodyXPath + "//div[@class='selectItemText' or @class='selectItemTextFocused']";
        else if (elTag == 'img' && (srcAttr.endsWith('comboBoxPicker.png') || srcAttr.endsWith('comboBoxPicker_Over.png')))
            elXPath = windowBodyXPath + "//img[contains(@src,'comboBoxPicker.png') or contains(@src,'comboBoxPicker_Over.png')]";
    } else if (e.closest('div.windowHeader')) {
        console.log('Inside GWT window header');
        var windowHeaderXPath = "//div[@class='windowHeader' and not(ancestor::*[contains(@style,'visibility: hidden')])]";
        if (elTag == 'td' && elClass == 'windowHeaderText')
            elXPath = windowHeaderXPath + "//td[@class='windowHeaderText']";
        else if (elTag == 'img' && (srcAttr.endsWith('close.png') || srcAttr.endsWith('close_Over.png'))) {
            elXPath = windowHeaderXPath + "//img[contains(@src,'close.png') or contains(@src,'close_Over.png')]";
            displayName = 'Close';
        }
    }
    console.log('elXPath:' + elXPath);
    if (elXPath && locatorBuilders.isElementUniqueWithXPathInAllVisibleIframes(elXPath, e)) {
        if (!LocatorBuilders.displayName && displayName)
        LocatorBuilders.displayName = displayName;
        return elXPath;
    }
    return null;
}
