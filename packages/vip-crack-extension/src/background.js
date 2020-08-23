import PluginUtil from "@/utils/PluginUtil";
import {
  getHostname,
  convertSourceObj,
  hourToMillisecond,
  getChromeVersion,
} from "shared/util";
import ApiUtil from "./utils/ApiUtil";
import Config from "./utils/Config";

const CHROME_VERSION = getChromeVersion();
const dispatchObj = {};

// popup.js 与 background.js 之前通信不通过chrome.runtime.sendMessage，使用 chrome.extension.getBackgroundPage()
window.dispatchAction = params => {
  return new Promise(resolve => {
    const request = {
      ...params,
    };
    const sender = {};
    const sendResponse = response => {
      resolve(response);
    };
    const fn = dispatchObj[request.operate];
    // 注意：request 与 sender 都只是模拟 chrome.runtime.onMessage 的参数，只是保证行为基本一致而已，别当真！！！
    fn && fn(request, sender, sendResponse);
  });
};

const listen = () => {
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (sender.tab && typeof request.operate !== "undefined") {
      const fn = dispatchObj[request.operate];
      const result = fn && fn(request, sender, sendResponse);
      return result;
    }
  });
};
listen();

/**
 * 点亮图标
 */
dispatchObj["enableVipCrack"] = (request, sender) => {
  const status = request.value;
  chrome.browserAction.setIcon({
    tabId: sender.tab.id,
    path: {
      16: `/icons/16${status ? "" : "-gray"}.png`,
      32: `/icons/32${status ? "" : "-gray"}.png`,
      48: `/icons/48${status ? "" : "-gray"}.png`,
      128: `/icons/128${status ? "" : "-gray"}.png`,
    },
  });
  // NOTE 取消所有请求的cors限制，不知道会不会出事...
  // TODO 先不启用
  // allowAllOrigin(status);
};

// eslint-disable-next-line no-unused-vars
function allowAllOrigin(status) {
  if (status) {
    chrome.webRequest.onBeforeSendHeaders.addListener(
      allowAllOriginHandler,
      { urls: ["<all_urls>"] },
      // https://stackoverflow.com/a/59296870/11738392
      // https://github.com/bewisse/modheader/blob/master/src/js/background.js
      CHROME_VERSION.major >= 72
        ? ["requestHeaders", "blocking", "extraHeaders"]
        : ["requestHeaders", "blocking"]
    );
  } else {
    chrome.webRequest.onBeforeSendHeaders.removeListener(allowAllOriginHandler);
  }
}

function allowAllOriginHandler(details) {
  const newHeader = { name: "Access-Control-Allow-Origin", value: "*" };
  let responseHeaders = details.responseHeaders || [];
  responseHeaders = responseHeaders.concat(newHeader);
  return { responseHeaders };
}

/**
 * 发送notice消息
 */
dispatchObj["isNotice"] = request => {
  const { type, iconUrl, title, message } = request.params;
  chrome.notifications.create(null, {
    type,
    iconUrl,
    title,
    message,
  });
};

/**
 * 跨域请求
 */
dispatchObj["isRequest"] = (request, sender, sendResponse) => {
  (async () => {
    // 注意fetch的两个await
    const res = await fetch(request.url, request.params);
    const data = await res.json();
    sendResponse(data);
  })();
  /**
   * sendResponse异步消息，需告知等待 https://stackoverflow.com/questions/53024819/chrome-extension-sendresponse-not-waiting-for-async-function
   */
  return true;
};

dispatchObj["checkForUpdate"] = () => {
  checkAndSync();
};

dispatchObj["sync"] = (request, sender, sendResponse) => {
  (async () => {
    await sync();
    sendResponse(true);
  })();
  return true;
};

/**
 * 网络请求拦截
 * FIXME background.js销毁后就失效。难整。因为现在没用到了，所以先不改
 */
const proxyNetwork = () => {
  PluginUtil.get().then(plugins => {
    plugins.forEach(item => {
      // 需要用到 plugin 里的 function，需自行调用 convertSourceObj
      const plugin = convertSourceObj(item.sourceCode);
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
            urls: [`*://*.${hostname}/*`],
          }
        );
      });
    });
  });
};

// UNKNOWN 只有解决完 proxyNetwork 的 bug，这里才能进行下去
const clearProxyNetwork = () => {};

const sync = async () => {
  // 同步
  const [, apiList] = await Promise.all([PluginUtil.sync(), ApiUtil.sync()]);

  // 更新上一次同步时间
  const currentTime = new Date().getTime();
  chrome.storage.local.set({
    lastUpdatedTime: currentTime,
  });

  // 保证同步后选中源依然有效
  const config = await Config.get();
  if (typeof config.selectedSourceId === "undefined") {
    // 如果是第一次，默认开启并使用第一个源
    config.selectedSourceId = apiList[0].id;
    await Config.setObj(config);
  } else {
    const api = apiList.find(i => i.id === config.selectedSourceId);
    if (!api) {
      // api 不存在说明使用的源被删掉了，默认选中第一个源
      await Config.set("selectedSourceId", apiList[0].id);
    }
  }

  // 取消先前网络监听
  clearProxyNetwork();

  // 监听网络
  proxyNetwork();
};

/**
 * 同步插件和Api列表
 */
const checkAndSync = () => {
  chrome.storage.local.get(["lastUpdatedTime"], async ({ lastUpdatedTime }) => {
    // 存在上一次更新时间，判断是否需要立即更新
    const currentTime = new Date().getTime();
    if (lastUpdatedTime) {
      const interval = currentTime - lastUpdatedTime;
      // 需要更新的间隔时间（单位：ms）
      const needToUpdateInterval = await Config.get("intervalVal");
      // 说明还没到更新的点
      if (interval < needToUpdateInterval) return;
    }

    sync();
  });
};

const init = async () => {
  /**
   * enableObj: 各插件的开启状态
   * intervalVal: 更新周期
   */
  const config = await Config.get();
  if (JSON.stringify(config) !== "{}") return;
  await Config.setObj({
    enable: true,
    enableObj: {},
    intervalVal: hourToMillisecond(6),
  });
};

/**
 * 插件第一次安装、插件更新、浏览器更新，均会触发事件onInstalled
 */
chrome.runtime.onInstalled.addListener(async () => {
  // 初始化
  await init();
  // 同步
  sync();
});
