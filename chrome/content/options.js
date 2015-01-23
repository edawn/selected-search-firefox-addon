var prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService);
var engineBranch = prefs.getBranch("extensions.selectedsearch.engines.");
var disabledArray = engineBranch.getChildList("", {});

var isEnabled = function(engineId){
    var di = disabledArray.indexOf(engineId);
    return di == -1 ? true : engineBranch.getBoolPref(disabledArray[di]);
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
        prefs.getBoolPref("extensions.selectedsearch.contextshowtext");
    doc.getElementById("contextshowtextfield").checked =
        prefs.getBoolPref("extensions.selectedsearch.contextshowtextfield");
    doc.getElementById("contextshowctrl").checked =
        prefs.getBoolPref("extensions.selectedsearch.usectrlkey");
    doc.getElementById("autocptext").checked =
        prefs.getBoolPref("extensions.selectedsearch.autocptext");
    doc.getElementById("autocptextfield").checked =
        prefs.getBoolPref("extensions.selectedsearch.autocptextfield");
    doc.getElementById("offsetx").valueNumber =
        prefs.getIntPref("extensions.selectedsearch.offsetx");
    doc.getElementById("offsety").valueNumber =
        prefs.getIntPref("extensions.selectedsearch.offsety");
    doc.getElementById("offsetx.center").checked =
        prefs.getBoolPref("extensions.selectedsearch.offsetx.center");	
	doc.getElementById("textual").selectedIndex =
		prefs.getBoolPref("extensions.selectedsearch.textual") == true ? 0 : 1;
	doc.getElementById("iconrow").valueNumber =
        prefs.getIntPref("extensions.selectedsearch.iconrow");
	doc.getElementById("button0").selectedIndex =
        prefs.getIntPref("extensions.selectedsearch.button0");
	doc.getElementById("button0.close").checked =
        prefs.getBoolPref("extensions.selectedsearch.button0.close");
	doc.getElementById("button1").selectedIndex =
        prefs.getIntPref("extensions.selectedsearch.button1");
	doc.getElementById("button1.close").checked =
        prefs.getBoolPref("extensions.selectedsearch.button1.close");
}

var accept = function(){
    var doc = window.document;
    var ebox = doc.getElementById("engines");
    var cblist = ebox.getElementsByTagName("checkbox");
    for (var i = 0; i < cblist.length; i++){
	    engineBranch.setBoolPref(cblist[i].label, cblist[i].checked);
    }
    var elem = doc.getElementById("contextshowtext");
    prefs.setBoolPref("extensions.selectedsearch.contextshowtext", elem.checked);
    elem = doc.getElementById("contextshowtextfield");
    prefs.setBoolPref("extensions.selectedsearch.contextshowtextfield", elem.checked);
    elem = doc.getElementById("contextshowctrl");
    prefs.setBoolPref("extensions.selectedsearch.usectrlkey", elem.checked);
    elem = doc.getElementById("autocptext");
    prefs.setBoolPref("extensions.selectedsearch.autocptext", elem.checked);
    elem = doc.getElementById("autocptextfield");
    prefs.setBoolPref("extensions.selectedsearch.autocptextfield", elem.checked);
    elem = doc.getElementById("offsetx");
    prefs.setIntPref("extensions.selectedsearch.offsetx", elem.valueNumber);
    elem = doc.getElementById("offsety");
    prefs.setIntPref("extensions.selectedsearch.offsety", elem.valueNumber);    
	elem = doc.getElementById("offsetx.center");
    prefs.setBoolPref("extensions.selectedsearch.offsetx.center", elem.checked);
    elem = doc.getElementById("textual");
    prefs.setBoolPref("extensions.selectedsearch.textual", elem.selectedIndex == 0 ? 1 : 0);
	elem = doc.getElementById("iconrow");
	prefs.setIntPref("extensions.selectedsearch.iconrow", elem.valueNumber);
    elem = doc.getElementById("button0");
    prefs.setIntPref("extensions.selectedsearch.button0", elem.selectedIndex);
    elem = doc.getElementById("button0.close");
    prefs.setBoolPref("extensions.selectedsearch.button0.close", elem.checked);
    elem = doc.getElementById("button1");
    prefs.setIntPref("extensions.selectedsearch.button1", elem.selectedIndex);
    elem = doc.getElementById("button1.close");
    prefs.setBoolPref("extensions.selectedsearch.button1.close", elem.checked);
    window.close();
}

window.addEventListener("load", init, false);
