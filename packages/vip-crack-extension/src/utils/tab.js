export const reload = () => {
  chrome.tabs.reload();
  window.close();
};

export const createNear = ({
  url,
  direction = "right",
  closeWindow = false,
}) => {
  const offset = direction === "left" ? -1 : 1;
  chrome.tabs.query(
    {
      active: !0,
      currentWindow: !0,
    },
    function (a) {
      chrome.tabs.create({
        url,
        index: a[0].index + offset,
        active: !0,
        openerTabId: a[0].id,
      });
      closeWindow && window.close();
    }
  );
};

export const sendMessage = (message, callback) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (callback) callback(response);
    });
  });
};

export const changeBrowserIcon = status => {
  chrome.tabs.query(
    {
      active: !0,
      currentWindow: !0,
    },
    function (a) {
      chrome.browserAction.setIcon({
        tabId: a[0].id,
        path: {
          16: `/icons/16${status ? "" : "-gray"}.png`,
          32: `/icons/32${status ? "" : "-gray"}.png`,
          48: `/icons/48${status ? "" : "-gray"}.png`,
          128: `/icons/128${status ? "" : "-gray"}.png`,
        },
      });
    }
  );
};
