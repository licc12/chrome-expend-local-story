(function (window, document, $, chrome) {
  "use strict";

  function htmlEscape(str, noQuotes) {
    var map = [];
    map["&"] = "&amp;";
    map["<"] = "&lt;";
    map[">"] = "&gt;";

    var regex;

    if (noQuotes) {
      regex = /[&<>]/g;
    } else {
      map['"'] = "&#34;";
      map["'"] = "&#39;";
      regex = /[&<>"']/g;
    }

    return ("" + str).replace(regex, function (match) {
      return map[match];
    });
  }

  function loading(value) {
    var $loading = $("#loading");
    var $html = $("html");

    if (value) {
      $loading.width($html.width());
      $loading.height($html.height());
      $loading.show();
    } else {
      $loading.hide();
    }
  }

  function getTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
      callback(tab[0].id, tab[0].url);
    });
  }

  function executeScript(msg, callback) {
    getTab(function (tabId) {
      var exec = chrome.tabs.executeScript;
      exec(tabId, { code: "var msg = " + JSON.stringify(msg) }, function () {
        if (chrome.runtime.lastError) {
          callback && callback(undefined);
          return;
        }
        exec(tabId, { file: "inject.js" }, function (response) {
          callback && callback(response[0]);
        });
      });
    });
  }

  function noData() {
    var pClass;
    var promptText;
    if (type === "Local") {
      pClass = "localstorage";
      promptText = "local";
    }
    $("#copy").hide();
    return (
      '<p class="' +
      pClass +
      " error" +
      '">该页面暂无任何 ' +
      promptText +
      " Storage相关 数据~</p>"
    );
  }
  //------------------------------------------------------------------------------

  var type;
  var $type = $("#type");

  if (localStorage["type"] === "Local" || localStorage["type"] === undefined) {
    $("#main").show();
    $("#test").hide();
    type = "Local";
    $type.attr("class", "localstorage").html("Local");
  }
  executeScript({ what: "get", type: type }, function (response) {
    var storage = response;
    var str = "";
    var key;
    var value;
    var size = 0;
    var tableClass = type === "Local" ? "localstorage" : "sessionstorage";
    $("#paste").show();
    if (storage === undefined) {
      str = noData();
    } else {
      str += '<table class="' + tableClass + '">';
      str += "<thead>";
      str += "<tr>";
      str += '<th class="td-nome">键</th>';
      str += '<th class="td-value" colspan="3">值</th>';
      str += "</tr>";
      str += "</thead>";
      str += "<tbody>";

      for (var i in storage) {
        key = htmlEscape(i);
        value = htmlEscape(storage[i]);

        str += "<tr>";
        str += '<td class="td-nome"><input disabled type="text" value="';
        str += key + '" data-key="' + key + '"></td>';
        str +=
          '<td class="td-value"><textarea  rows="2" type="textarea" class="valueinput">';
        str += value + "</textarea></td>";
        str += "</tr>";
        size++;
      }
      str += "</tbody></table>";
      if (!size) {
        str = noData();
      }
    }

    $("#table").html(str);
  });

  $("#copy").on("click", function (e) {
    e.preventDefault();
    loading(true);
    executeScript({ type: type, what: "export" }, function (response) {
      if (response === undefined) {
        loading(false);
        return;
      }
      var e = document.createElement("textarea");
      e.style.position = "fixed";
      e.style.opacity = 0;
      e.value = JSON.stringify(response);
      document.body.appendChild(e);
      e.select();
      document.execCommand("copy");
      document.body.removeChild(e);
      loading(false);
    });
  });
  $("#paste").on("click", function (e) {
    e.preventDefault();
    loading(true);
    var e = document.createElement("textarea");
    e.style.position = "fixed";
    e.style.opacity = 0;
    document.body.appendChild(e);
    e.focus();
    document.execCommand("paste");
    var value = JSON.parse(e.value || "{}");
    var message = {
      type: type,
      what: "set",
      key: "TOKEN",
      value: value.TOKEN || "",
    };
    document.body.removeChild(e);
    executeScript(message, function () {
      location.reload();
    });
    loading(false);
  });
})(window, document, jQuery, chrome);
