var showContextMenu = undefined;

updateCallback = function () {
  if (showContextMenu !== preferences.showContextMenu) {
    showContextMenu = preferences.showContextMenu;
    setContextMenu(showContextMenu);
  }
};

//Every time the browser restarts the first time the user goes to the options he ends up in the default page (support)
localStorage.setItem("option_panel", "null");

var currentVersion = chrome.runtime.getManifest().version;
var oldVersion = data.lastVersionRun;

data.lastVersionRun = currentVersion;

setContextMenu(preferences.showContextMenu);

// Use new API to delete SET-COOKIE headers as requested by users
chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    headersToForward = [];
    if (details.responseHeaders !== undefined) {
      headersChanged = false;
      for (var i = 0; i < details.responseHeaders.length; i++) {
        cH = details.responseHeaders[i];
        if (cH.name.toUpperCase() != "SET-COOKIE") {
          headersToForward.push(cH);
          continue;
        }

        fields = cH.value.split(";");

        var cookieName = undefined;
        var cookieDomain = undefined;
        var cookieValue = undefined;

        if (fields.length > 0) {
          cookieName = fields[0].split("=")[0];
          cookieValue = fields[0].split("=")[1];
        }

        for (var x = 1; x < fields.length; x++) {
          if (fields[x].split("=")[0].trim() == "domain") {
            cookieDomain = fields[x].split("=")[1];
            break;
          }
        }

        if (
          cookieName !== undefined &&
          cookieDomain !== undefined &&
          cookieValue !== undefined
        ) {
          var forwardHeader = true;
          for (var x = 0; x < data.filters.length; x++) {
            if (
              filterMatchesCookie(
                data.filters[x],
                cookieName,
                cookieDomain,
                cookieValue
              )
            ) {
              forwardHeader = false;
              break;
            }
          }

          if (forwardHeader) {
            headersToForward.push(cH);
          } else {
            // Do not add current set-cookie to headers. This cookie was flagged as blocked
            headersChanged = true;
          }
        }
      }
    }

    if (headersChanged) {
      return { responseHeaders: headersToForward };
    } else {
      return {};
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders", "extraHeaders"]
);

function setContextMenu(show) {
  chrome.contextMenus.removeAll();
  if (show) {
    chrome.contextMenus.create({
      title: "EditThisCookie",
      contexts: ["page"],
      onclick: function (info, tab) {
        showPopup(info, tab);
      },
    });
  }
}
