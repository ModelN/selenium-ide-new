/**
 * Created by Tvegiraju on 12/30/2019.
 */

 //import browser from 'webextension-polyfill';
 import * as builders from './customBuilders';
 import LocatorBuilders from './locator-builders_custom';
 
 export default class customLocatorBuilders {
    locatorBuilders: LocatorBuilders
     constructor(locatorBuilders: LocatorBuilders) {
         this.locatorBuilders = locatorBuilders;
         //this.setPreferredOrderByAppTypeFirstTime();
     }
     updateAppType(appType: string) {
        //Gajanan: Added to resolve build issue
        var customBuilder = builders[appType as keyof typeof builders] || builders.Base;
        console.log(builders);
         //Clean up locator builder
         this.locatorBuilders.cleanup();
         //update app specific methods
         customBuilder.updateAppSpecificOrder();
         console.log('LocatorBuilders length: ' + LocatorBuilders.order.length);
     }
    //  setPreferredOrderByAppTypeFirstTime() {
    //      var self = this;
    //      /*browser.runtime.sendMessage({ type: "getAppType" }).then(function (response) {
    //          if (response && response.appType) {
    //              self.updateAppType(response.appType);
    //              console.log('Updated First time order for App Type: ' + response.appType);
    //          }
    //      });*/
    //  }
 }
 
 
 
 