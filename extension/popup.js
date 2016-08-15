function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function renderStatus(statusText) {
    document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
    getCurrentTabUrl(function(url) {
        console.log(url);
        if (url.match(/http:\/{2}www.mangapanda.com[/][a-zA-Z0-9\-]+[/][0-9]+/) !== null) {
            mangapanda(url);
        } else if (url.match(/http:\/{2}www.readcomics.tv\/[0-9A-Za-z/-]+/g)) {
            readcomics(url);
        } else {
            renderStatus("invalid page. Please open a proper comic page");    
        }
    });
});

function mangapanda(url) {
    var mangaName = url.match(/\/[a-z0-9A-Z/-]+\//g);
    mangaName = mangaName[0].split("/")[1];

    var issue = url.match(/http[:][/][/]www.mangapanda.com[/][a-zA-Z0-9\-]+[/][0-9]+[/][0-9]+/g);

    if (issue === null) {
        issue = url.match(/\/[0-9]+/g);

        if (issue.length === 2) {
            issue = issue[1];
            issue = issue.split("/")[1];
        } else {
            issue = issue[0];
            issue = issue.split("/")[1];
        }
    } else {
        issue = url.match(/\/[0-9]+\//g);

        if (issue.length === 2) {
            issue = issue[1];
            issue = issue.split("/")[1];
        } else {
            issue = issue[0];
            issue = issue.split("/")[1];
        }
    }

    sendRequest(mangaName, issue, "mangapanda");
}

function readcomics(url) {
    var mangaName = url.match(/\/[0-9A-Za-z\-]+\//g);
    mangaName = mangaName[0].split("/")[1];

    var issue = url.match(/chapter\-[0-9]+/g);

    issue = issue[0].split("chapter-")[1];

    sendRequest(mangaName, issue, "readcomics");
}

function sendRequest(mangaName, issue, web) {
    var request = new XMLHttpRequest();
    var query = "name=" + mangaName + "&web=" + web + "&issue=" + issue;

    request.open("get", "http://localhost:8081/scrape?" + query, true);
    request.send();
    request.onreadystatechange = getResponse;
}

function getResponse() {
    renderStatus(this);
}
