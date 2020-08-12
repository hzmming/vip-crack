import PluginUtil from "@/utils/PluginUtil";
import { getHostname } from "@/utils/helps";

const dispatchObj = {};

const listen = () => {
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (sender.tab && typeof request.operate !== "undefined") {
      const fn = dispatchObj[request.operate];
      fn && fn(request, sender, sendResponse);
    }
  });
};
listen();

/**
 * 点亮图标
 */
dispatchObj["enableVipCrack"] = (request, sender) => {
  const status = request.enableVipCrack;
  chrome.browserAction.setIcon({
    tabId: sender.tab.id,
    path: {
      16: `/icons/16${status ? "" : "-gray"}.png`,
      32: `/icons/32${status ? "" : "-gray"}.png`,
      48: `/icons/48${status ? "" : "-gray"}.png`,
      128: `/icons/128${status ? "" : "-gray"}.png`
    }
  });
};

PluginUtil.get().then(plugins => {
  plugins.forEach(plugin => {
    const background = plugin?.network?.background;
    if (!background) return;
    const hostname = getHostname(plugin.url);
    const bgList = [].concat(background);
    bgList.forEach(bg => {
      chrome.webRequest.onCompleted.addListener(
        details => {
          const { initiator, url, tabId } = details;
          if (initiator && initiator.includes(hostname)) {
            const matchList = [].concat(bg.url);
            const isMatch = matchList.some(match => {
              if (bg.operator === "equal") {
                return url === match;
              }
              // 默认 include
              return url.includes(match);
            });
            if (isMatch) {
              chrome.tabs.sendMessage(tabId, bg.message);
            }
          }
        },
        {
          urls: [`*://*.${hostname}/*`]
        }
      );
    });
  });
});
