/**
 * Created by Tvegiraju on 12/27/2019.
 */

import finder from '@medv/finder'
import LocatorBuilders from '../locator-builders_custom';
import { locatorBuilders } from '../record-handlers_custom';

export default function locatorBuilder_Base() {

}

locatorBuilder_Base.updateAppSpecificOrder = function () {
    console.log('inside base')
    LocatorBuilders.add('css:data-attr', cssDataAttr);
    LocatorBuilders.add('id', id);
    LocatorBuilders.add('linkText', linkText);
    LocatorBuilders.add('name', name);
    LocatorBuilders.add('css:finder', cssFinder);
    LocatorBuilders.add('xpath:link', xpathLink);
    LocatorBuilders.add('xpath:img', xpathImg);
    LocatorBuilders.add('xpath:attributes', locatorBuilders.xpathAttr);
    LocatorBuilders.add('xpath:idRelative', xpathIdRelative);
    LocatorBuilders.add('xpath:href', xpathHref);
    LocatorBuilders.add('xpath:position', xpathPosition);
    LocatorBuilders.add('xpath:innerText', xpathInnerText);
};

function cssDataAttr(e: any) {
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

function id(e: any) {
    if (e.id) {
        return 'id=' + e.id
    }
    return null
}

function linkText(e: any) {
    if (e.nodeName == 'A') {
        let text = e.textContent
        if (!text.match(/^\s*$/)) {
            return (
                'linkText=' + text.replace(/\xA0/g, ' ').replace(/^\s*(.*?)\s*$/, '$1')
            )
        }
    }
    return null
}

function name(e: any) {
    if (e.name)
        return 'name=' + e.name
    return null
}

function cssFinder(e: any) {
 return 'css=' + finder(e)
}

function xpathLink(e: any) {
    if (e.nodeName == 'A') {
        let text = e.textContent
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

function xpathImg(e: any) {
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
}

function xpathIdRelative(e: any) {
    let path = ''
    let current = e
    while (current != null) {
        if (current.parentNode != null) {
            path = LocatorBuilders.relativeXPathFromParent(current) + path
            if (
                1 == current.parentNode.nodeType && // ELEMENT_NODE
                current.parentNode.getAttribute('id')
            ) {
                return LocatorBuilders.preciseXPath(
                    '//' +
                    LocatorBuilders.xpathHtmlElement(current.parentNode.nodeName.toLowerCase()) +
                    '[@id=' +
                    LocatorBuilders.attributeValue(current.parentNode.getAttribute('id')) +
                    ']' +
                    path,
                    e
                )
            }
        } else {
            return null
        }
        current = current.parentNode
    }
    return null
}

function xpathHref(e: any) {
    if (e.attributes && e.hasAttribute('href')) {
        let href = e.getAttribute('href')
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
}

function xpathPosition(
    e: any,
    opt_contextNode: any
) {
    let path = ''
    let current = e
    while (current != null && current != opt_contextNode) {
        let currentPath
        if (current.parentNode != null) {
            currentPath = LocatorBuilders.relativeXPathFromParent(current)
        } else {
            currentPath = '/' + xpathHtmlElement(current.nodeName.toLowerCase())
        }
        path = currentPath + path
        let locator = '/' + path
        if (e == LocatorBuilders.findElement(locator)) {
            return 'xpath=' + locator
        }
        current = current.parentNode
    }
    return null
}

function xpathInnerText(el: any) {
    if (el.innerText) {
        return `xpath=//${el.nodeName.toLowerCase()}[contains(.,'${el.innerText}')]`
    } else {
        return null
    }
}

function xpathHtmlElement(name: string) {
    if (window.document.contentType == 'application/xhtml+xml') {
      // "x:" prefix is required when testing XHTML pages
      return 'x:' + name
    } else {
      return name
    }
  }