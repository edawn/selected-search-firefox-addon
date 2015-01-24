var prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService);
var ssPrefs = prefs.getBranch("extensions.selectedsearch.");
var enginePrefs = prefs.getBranch("extensions.selectedsearch.engines.");
var disabledArray = enginePrefs.getChildList("", {});

var isEnabled = function(engineId){
    var di = disabledArray.indexOf(engineId);
    return di == -1 ? true : enginePrefs.getBoolPref(disabledArray[di]);
}

var init = function(){
    var doc = window.document;

	var h = doc.getElementById("rbox").clientHeight;
	doc.getElementById("lbox").setAttribute("maxheight", h);

    var ebox = doc.getElementById("engines");

    var searchService = Components.classes["@mozilla.org/browser/search-service;1"]
			.getService(Components.interfaces.nsIBrowserSearchService);
                      
    var engines = searchService.getVisibleEngines({});
        
    for (var i = 0; i < engines.length; i++)
    {
	var cb = document.createElement("checkbox");
	cb.setAttribute("label", engines[i].name);
	if (engines[i].iconURI) {
	    cb.setAttribute("src", engines[i].iconURI.spec);
        }
	cb.setAttribute("checked", isEnabled(engines[i].name));
	cb.height = 20;
	ebox.appendChild(cb);
    }
    doc.getElementById("contextshowtext").checked =
        ssPrefs.getBoolPref("contextshowtext");
    doc.getElementById("contextshowtextfield").checked =
        ssPrefs.getBoolPref("contextshowtextfield");
    doc.getElementById("contextshowctrl").checked =
        ssPrefs.getBoolPref("usectrlkey");
    doc.getElementById("autocptext").checked =
        ssPrefs.getBoolPref("autocptext");
    doc.getElementById("autocptextfield").checked =
        ssPrefs.getBoolPref("autocptextfield");
    doc.getElementById("offsetx").valueNumber =
        ssPrefs.getIntPref("offsetx");
    doc.getElementById("offsety").valueNumber =
        ssPrefs.getIntPref("offsety");
    doc.getElementById("offsetx.center").checked =
        ssPrefs.getBoolPref("offsetx.center");	
	doc.getElementById("textual").selectedIndex =
		ssPrefs.getBoolPref("textual") == true ? 0 : 1;
	doc.getElementById("iconrow").valueNumber =
        ssPrefs.getIntPref("iconrow");
	doc.getElementById("iconsize").valueNumber = ssPrefs.getIntPref("iconsize");
	doc.getElementById("button0").selectedIndex =
        ssPrefs.getIntPref("button0");
	doc.getElementById("button0.close").checked =
        ssPrefs.getBoolPref("button0.close");
	doc.getElementById("button1").selectedIndex =
        ssPrefs.getIntPref("button1");
	doc.getElementById("button1.close").checked =
        ssPrefs.getBoolPref("button1.close");
}

var accept = function(){
    var doc = window.document;
    var ebox = doc.getElementById("engines");
    var cblist = ebox.getElementsByTagName("checkbox");
    for (var i = 0; i < cblist.length; i++){
	    enginePrefs.setBoolPref(cblist[i].label, cblist[i].checked);
    }
    var elem = doc.getElementById("contextshowtext");
    ssPrefs.setBoolPref("contextshowtext", elem.checked);
    elem = doc.getElementById("contextshowtextfield");
    ssPrefs.setBoolPref("contextshowtextfield", elem.checked);
    elem = doc.getElementById("contextshowctrl");
    ssPrefs.setBoolPref("usectrlkey", elem.checked);
    elem = doc.getElementById("autocptext");
    ssPrefs.setBoolPref("autocptext", elem.checked);
    elem = doc.getElementById("autocptextfield");
    ssPrefs.setBoolPref("autocptextfield", elem.checked);
    elem = doc.getElementById("offsetx");
    ssPrefs.setIntPref("offsetx", elem.valueNumber);
    elem = doc.getElementById("offsety");
    ssPrefs.setIntPref("offsety", elem.valueNumber);    
	elem = doc.getElementById("offsetx.center");
    ssPrefs.setBoolPref("offsetx.center", elem.checked);
    elem = doc.getElementById("textual");
    ssPrefs.setBoolPref("textual", elem.selectedIndex == 0 ? 1 : 0);
	elem = doc.getElementById("iconrow");
	ssPrefs.setIntPref("iconrow", elem.valueNumber);
	elem = doc.getElementById("iconsize");
	ssPrefs.setIntPref("iconsize", elem.valueNumber);
    elem = doc.getElementById("button0");
    ssPrefs.setIntPref("button0", elem.selectedIndex);
    elem = doc.getElementById("button0.close");
    ssPrefs.setBoolPref("button0.close", elem.checked);
    elem = doc.getElementById("button1");
    ssPrefs.setIntPref("button1", elem.selectedIndex);
    elem = doc.getElementById("button1.close");
    ssPrefs.setBoolPref("button1.close", elem.checked);
    window.close();
}

window.addEventListener("load", init, false);
