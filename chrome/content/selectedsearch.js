var selectedsearch =
{
  searchText: null,
  prefs: null,
  engineBranch: null,
  clipboard: null,
  window: null,
  popup: null,
  newTab: null,
  load: function () {
    selectedsearch.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefService);
    selectedsearch.engineBranch = selectedsearch.prefs.getBranch("extensions.selectedsearch.engines.");
    selectedsearch.clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
	    	.getService(Components.interfaces.nsIClipboardHelper);
    selectedsearch.popup = document.getElementById("selectedsearch-popup");

	// center horizontally
	selectedsearch.popup.addEventListener("popupshown", function(e){
	  if (!selectedsearch.prefs.getBoolPref("extensions.selectedsearch.offsetx.center")) return;
	  var popup = e.target;
	  var bo = popup.boxObject;
	  popup.moveTo(bo.screenX-selectedsearch.prefs.getIntPref("extensions.selectedsearch.offsetx")-bo.width/2,bo.screenY);
	}, false); 
    
    gBrowser.addEventListener("mousedown", selectedsearch.mousedownhandler, false);
    gBrowser.addEventListener("mouseup", selectedsearch.mouseuphandler, false);
    gBrowser.addEventListener("keydown", selectedsearch.keydownhandler, false);
  },
 
  mousedownhandler: function(event) {
    if (event.button != 0) return;
	var selectedText;
    var et = event.target;
    if (et.tagName == "TEXTAREA" || (et.tagName == "INPUT" && et.type == "text")){
      selectedText = et.value.substring(et.selectionStart, et.selectionEnd);
	} else {
	  selectedText = event.view.getSelection().toString();
	}
    selectedsearch.searchText = selectedText.trim();
  },
    
  mouseuphandler: function(event) {
    if (event.button != 0) return;
	if (selectedsearch.prefs.getBoolPref("extensions.selectedsearch.usectrlkey") && !event.ctrlKey) return;
    var searchText = "";
    var toCopy = "";
    var et = event.target;
    if (et.tagName == "TEXTAREA" || (et.tagName == "INPUT" && et.type == "text")){
      var selectedText = et.value.substring(et.selectionStart, et.selectionEnd);
      if (selectedText.length == 0) return;
      if (selectedsearch.prefs.getBoolPref("extensions.selectedsearch.autocptextfield")) toCopy = selectedText;
      if (selectedsearch.prefs.getBoolPref("extensions.selectedsearch.contextshowtextfield")) searchText = selectedText;
    }
    else {
      var selectedText = event.view.getSelection().toString();
      if (selectedText.length == 0) return;
      if (selectedsearch.prefs.getBoolPref("extensions.selectedsearch.autocptext")) toCopy = selectedText;
      if (selectedsearch.prefs.getBoolPref("extensions.selectedsearch.contextshowtext")) searchText = selectedText;
    }
    if (toCopy != "") selectedsearch.clipboard.copyString(toCopy);

    searchText = searchText.trim();
    if (searchText.length == 0 || searchText == selectedsearch.searchText) return;
    selectedsearch.searchText = searchText;
    selectedsearch.rebuildmenu();
	
	var x = event.screenX+selectedsearch.prefs.getIntPref("extensions.selectedsearch.offsetx");
	// +1: avoids problems with tripleclick
	var y = event.screenY+selectedsearch.prefs.getIntPref("extensions.selectedsearch.offsety")+1;
    selectedsearch.popup.openPopupAtScreen(x, y, false);
  },
  
  keydownhandler: function(event) {
	if (!selectedsearch.prefs.getBoolPref("extensions.selectedsearch.usectrlkey") || event.keyCode != KeyboardEvent.DOM_VK_CONTROL) {
      selectedsearch.popup.hidePopup();
	}
  },

  isEnabledEngine: function(engineId) {
    var disabledArray = selectedsearch.engineBranch.getChildList("", {});
    var di = disabledArray.indexOf(engineId);
    return di == -1 ? true : selectedsearch.engineBranch.getBoolPref(disabledArray[di]);
  },

  rebuildmenu: function () {
    var searchService = Components.classes["@mozilla.org/browser/search-service;1"]
                          .getService(Components.interfaces.nsIBrowserSearchService);
                      
    var popup = selectedsearch.popup;
    var engines = searchService.getVisibleEngines({});
        
    // clear menu
    while (popup.firstChild) popup.removeChild(popup.firstChild);
	
	selectedsearch.newTab = null;
  
    var iconic = !selectedsearch.prefs.getBoolPref("extensions.selectedsearch.textual"); 
	var container;
	if (iconic) {
	  container = document.createElement("hbox");
	  popup.appendChild(container);
	} else {
	  container = popup;
	}
	var j = 0;
	for (var i = 0; i < engines.length; i++) {
      if (!selectedsearch.isEnabledEngine(engines[i].name)) continue;
      var searchitem;

	  if (!iconic) {
        searchitem = document.createElement("menuitem");
        searchitem.className = "menuitem-iconic";
		searchitem.setAttribute("label", engines[i].name);
		searchitem.setAttribute("closemenu", "none");
		if (engines[i].iconURI != null) {
		  searchitem.setAttribute("image", engines[i].iconURI.spec);
		}
      } else {
        searchitem = document.createElement("image");
		searchitem.setAttribute("width", "18");
		searchitem.setAttribute("height", "18");
		searchitem.setAttribute("tooltiptext", engines[i].name);
		if (engines[i].iconURI != null) {
			searchitem.setAttribute("src", engines[i].iconURI.spec);
		}
	  }

      container.appendChild(searchitem);
	  if (iconic && j >= selectedsearch.prefs.getIntPref("extensions.selectedsearch.iconrow")-1){
		container = document.createElement("hbox");
		popup.appendChild(container);
		j = 0;
	  } else {
	    j++;
	  }
      searchitem.engine = engines[i];
      searchitem.addEventListener("click", function(e){ selectedsearch.menuitemclick(e);}, false);
    }
  },
  
  menuitemclick: function (aEvent) {
    var btn = aEvent.button;
	if (btn != 0 && btn !=1) return;
	var close = selectedsearch.prefs.getBoolPref("extensions.selectedsearch.button"+btn+".close");
	if (close) selectedsearch.popup.hidePopup();
	var action = selectedsearch.prefs.getIntPref("extensions.selectedsearch.button"+btn);
    var params = selectedsearch.getSearchParams(aEvent.target.engine, selectedsearch.searchText);
	switch (action) {
      case 1: // Open in current tab
	    gBrowser.loadURIWithFlags(params.searchUrl, null, null, null, params.postData);
		break;
	  case 2: // Open in new background tab
	    gBrowser.addTab(params.searchUrl, null, null, params.postData, gBrowser.selectedTab, false);
		break;
	  case 3: // Open in new foreground tab
        gBrowser.selectedTab = gBrowser.addTab(params.searchUrl, null, null, params.postData, gBrowser.selectedTab, false);
		break;
	  case 4: // Open in one new foreground tab
	    if (!selectedsearch.newTab) {
		  selectedsearch.newTab = gBrowser.addTab(params.searchUrl, null, null, params.postData, gBrowser.selectedTab, false);
		  gBrowser.selectedTab = selectedsearch.newTab;
		} else {
		  gBrowser.selectedTab = selectedsearch.newTab;
	      gBrowser.loadURIWithFlags(params.searchUrl, null, null, null, params.postData);
		}
	}
  },

  getSearchParams: function (searchEngine, searchValue) {
  	var searchSubmission = searchEngine.getSubmission(searchValue, null);
	var postData = searchSubmission.postData ? searchSubmission.postData : null;
  	var searchUrl = searchSubmission.uri.spec;

  	if (!searchValue) {
  	  var uri = Components.classes['@mozilla.org/network/standard-url;1']
  	            .createInstance(Components.interfaces.nsIURI);
  	  uri.spec = searchUrl;
  	  searchUrl = uri.host;
    }
    
    var searchUrl = searchUrl.replace(/\+/g,"%20");
    return {searchUrl: searchUrl, postData: postData};
	}
}

window.addEventListener("load", selectedsearch.load, true);
