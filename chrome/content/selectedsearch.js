var selectedsearch = {
    searchText : null,
    ssPrefs : null,
    enginePrefs : null,
    clipboard : null,
    popup : null,
    newTab : null,
    parentTab : null,
    lastPopupWidth : null,
    load : function () {
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefService);
        selectedsearch.ssPrefs = prefs.getBranch("extensions.selectedsearch.");
        selectedsearch.enginePrefs = prefs.getBranch("extensions.selectedsearch.engines.");
        selectedsearch.clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper);
        selectedsearch.popup = document.getElementById("selectedsearch-popup");

        // center horizontally
        selectedsearch.popup.addEventListener("popupshown", function (e) {
            if (!selectedsearch.ssPrefs.getBoolPref("offsetx.center")) {
                return;
            }
            var popup = e.target;
            var bo = popup.boxObject;
            if (selectedsearch.lastPopupWidth != bo.width) {
                popup.moveTo(bo.screenX - selectedsearch.ssPrefs.getIntPref("offsetx") -
                    (bo.width - selectedsearch.lastPopupWidth) / 2, bo.screenY);
                selectedsearch.lastPopupWidth = bo.width;
            }
        }, false);

        var searchbar = document.getElementById("searchbar");
        if (!searchbar.hasAttribute("oneoffui") || searchbar.getAttribute("oneoffui") !== "true") {
            searchbar.textbox.addEventListener("mousedown", selectedsearch.mousedownhandler, false);
            searchbar.textbox.addEventListener("mouseup", selectedsearch.mouseuphandler, false);
            searchbar.textbox.addEventListener("keydown", selectedsearch.keydownhandler, false);
        }

        gBrowser.addEventListener("mousedown", selectedsearch.mousedownhandler, false);
        gBrowser.addEventListener("mouseup", selectedsearch.mouseuphandler, false);
        gBrowser.addEventListener("keydown", selectedsearch.keydownhandler, false);
    },

    mousedownhandler : function (event) {
        if (event.button != 0) {
            return;
        }
        var selectedText;
        var et = event.target;
        if (et.tagName == "TEXTAREA" || (et.tagName == "INPUT" && et.type == "text") || et.className == "searchbar-textbox") {
            selectedText = et.value.substring(et.selectionStart, et.selectionEnd);
        } else {
            selectedText = event.view.getSelection().toString();
        }
        selectedsearch.searchText = selectedText.trim();
    },

    mouseuphandler : function (event) {
        if (event.button != 0) {
            return;
        }
        if (selectedsearch.ssPrefs.getBoolPref("usectrlkey") && !event.ctrlKey) {
            return;
        }
        var searchText = "";
        var toCopy = "";
        var et = event.target;
        if (et.tagName == "TEXTAREA" || (et.tagName == "INPUT" && et.type == "text") || et.className == "searchbar-textbox") {
            var selectedText = et.value.substring(et.selectionStart, et.selectionEnd);
            if (selectedText.length == 0) {
                return;
            }
            if (selectedsearch.ssPrefs.getBoolPref("autocptextfield")) {
                toCopy = selectedText;
            }
            if (selectedsearch.ssPrefs.getBoolPref("contextshowtextfield")) {
                searchText = selectedText;
            }
        } else {
            var selectedText = event.view.getSelection().toString();
            if (selectedText.length == 0) {
                return;
            }
            if (selectedsearch.ssPrefs.getBoolPref("autocptext")) {
                toCopy = selectedText;
            }
            if (selectedsearch.ssPrefs.getBoolPref("contextshowtext")) {
                searchText = selectedText;
            }
        }
        if (toCopy != "") {
            selectedsearch.clipboard.copyString(toCopy);
        }

        searchText = searchText.trim();
        if (searchText.length == 0 || searchText == selectedsearch.searchText) {
            return;
        }
        selectedsearch.searchText = searchText;
        selectedsearch.rebuildmenu();

        var x = event.screenX + selectedsearch.ssPrefs.getIntPref("offsetx");
        if (selectedsearch.ssPrefs.getBoolPref("offsetx.center")) {
            x -= selectedsearch.lastPopupWidth / 2;
        }
        // +1: avoids problems with tripleclick
        var y = event.screenY + selectedsearch.ssPrefs.getIntPref("offsety") + 1;
        selectedsearch.popup.openPopupAtScreen(x, y, false);
        selectedsearch.parentTab = gBrowser.selectedTab;
    },

    keydownhandler : function (event) {
        if (!selectedsearch.ssPrefs.getBoolPref("usectrlkey") || event.keyCode != KeyboardEvent.DOM_VK_CONTROL) {
            selectedsearch.popup.hidePopup();
        }
    },

    isEnabledEngine : function (engineId) {
        var disabledArray = selectedsearch.enginePrefs.getChildList("", {});
        var di = disabledArray.indexOf(engineId);
        return di == -1 ? true : selectedsearch.enginePrefs.getBoolPref(disabledArray[di]);
    },

    rebuildmenu : function () {
        var searchService = Components.classes["@mozilla.org/browser/search-service;1"]
            .getService(Components.interfaces.nsIBrowserSearchService);
    
        var popup = selectedsearch.popup;
        var engines = searchService.getVisibleEngines({});

        // clear menu
        while (popup.firstChild) {
            popup.removeChild(popup.firstChild);
        }

        selectedsearch.newTab = null;

        var iconic = !selectedsearch.ssPrefs.getBoolPref("textual");
        var container;
        if (iconic) {
            container = document.createElement("hbox");
            popup.appendChild(container);
        } else {
            container = popup;
        }
        var iconSize = selectedsearch.ssPrefs.getIntPref("iconsize") + 2;
        var j = 0;
        for (var i = 0; i < engines.length; i++) {
            if (!selectedsearch.isEnabledEngine(engines[i].name)) {
                continue;
            }
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
                searchitem.setAttribute("width", iconSize);
                searchitem.setAttribute("tooltiptext", engines[i].name);
                if (engines[i].iconURI != null) {
                    searchitem.setAttribute("src", engines[i].iconURI.spec);
                }
            }
            searchitem.setAttribute("height", iconSize);

            container.appendChild(searchitem);
            if (iconic && j >= selectedsearch.ssPrefs.getIntPref("iconrow") - 1) {
                container = document.createElement("hbox");
                popup.appendChild(container);
                j = 0;
            } else {
                j++;
            }
            searchitem.engine = engines[i];
            searchitem.addEventListener("click", function (e) {
                selectedsearch.menuitemclick(e);
            }, false);
        }
    },

    menuitemclick : function (aEvent) {
        var btn = aEvent.button;
        if (btn != 0 && btn != 1) {
            return;
        }
        var close = selectedsearch.ssPrefs.getBoolPref("button" + btn + ".close");
        if (close) {
            selectedsearch.popup.hidePopup();
        }
        var action = selectedsearch.ssPrefs.getIntPref("button" + btn);
        var params = selectedsearch.getSearchParams(aEvent.target.engine, selectedsearch.searchText);
        switch (action) {
        case 1: // Open in current tab
            gBrowser.loadURIWithFlags(params.searchUrl, 0, null, null, params.postData);
            break;
        case 2: // Open in new background tab
            if ('TreeStyleTabService' in window) {
                TreeStyleTabService.readyToOpenChildTabNow(selectedsearch.parentTab);
            }
            gBrowser.addTab(params.searchUrl, {
                postData : params.postData,
                owner : selectedsearch.parentTab,
                relatedToCurrent : true
            });
            break;
        case 3: // Open in new foreground tab
            if ('TreeStyleTabService' in window) {
                TreeStyleTabService.readyToOpenChildTabNow(selectedsearch.parentTab);
            }
            gBrowser.selectedTab = gBrowser.addTab(params.searchUrl, {
                    postData : params.postData,
                    owner : selectedsearch.parentTab,
                    relatedToCurrent : true
                });
            break;
        case 4: // Open in one new foreground tab
            if (!selectedsearch.newTab) {
                if ('TreeStyleTabService' in window) {
                    TreeStyleTabService.readyToOpenChildTabNow(selectedsearch.parentTab);
                }
                selectedsearch.newTab = gBrowser.addTab(params.searchUrl, {
                        postData : params.postData,
                        owner : selectedsearch.parentTab,
                        relatedToCurrent : true
                    });
                gBrowser.selectedTab = selectedsearch.newTab;
            } else {
                gBrowser.selectedTab = selectedsearch.newTab;
                gBrowser.loadURIWithFlags(params.searchUrl, 0, null, null, params.postData);
            }
        }
    },

    getSearchParams : function (searchEngine, searchValue) {
        var searchSubmission = searchEngine.getSubmission(searchValue, null);
        var postData = searchSubmission.postData ? searchSubmission.postData : null;
        var searchUrl = searchSubmission.uri.spec;

        if (!searchValue) {
            var uri = Components.classes['@mozilla.org/network/standard-url;1']
                .createInstance(Components.interfaces.nsIURI);
            uri.spec = searchUrl;
            searchUrl = uri.host;
        }

        var searchUrl = searchUrl.replace(/\+/g, "%20");
        return {
            searchUrl : searchUrl,
            postData : postData
        };
    }
}

window.addEventListener("load", selectedsearch.load, true);