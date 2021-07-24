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

/**
 * 当前选中Api
 */
let selectedApi = {};
function getSelectedApi() {
  // chrome.webRequest.onBeforeSendHeaders callback需要用到选中的Api，但callback不支持异步，且阻塞请求也不大好（因为拦截了其它的url，不想误伤）
  // 所以改用 localStorage 作为桥梁
  const selectedApiStr = localStorage.getItem("selectedSource");
  console.log("selectedSource", selectedApiStr);
  if (selectedApiStr) {
    try {
      selectedApi = JSON.parse(selectedApiStr);
    } catch (e) {
      //
    }
  }
}
getSelectedApi();

window.updateStorageSelectedSource = function (sourceApi) {
  localStorage.setItem("selectedSource", JSON.stringify(sourceApi));
  getSelectedApi();
};

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

// 获取真实视频播放地址
const isMatch = str => {
  return [".m3u8", ".mp4"].find(i => str.endsWith(i));
};
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    const { url, tabId } = details;
    const urlObj = new URL(url);
    // 通过details.initiator可以知道请求从哪个domain发出，
    // 但很多第三方接口都是一层层iframe嵌套，而initiator取的是iframe的域名，如果直接限制死校验最外层的domain会匹配不到
    // 因此，还是先大面积匹配吧
    // details.parentFrameId 用于判断该请求是否来源于iframe，区分正常视频网页请求
    if (details.parentFrameId !== -1 && isMatch(urlObj.pathname)) {
      console.warn("识别出视频地址", url, details);
      chrome.tabs.sendMessage(
        tabId,
        {
          operate: "finalVideoUrl",
          value: url,
        },
        function () {}
      );
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody", "extraHeaders"]
);
const m3u8ContentType = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
];
const isMatchHeader = headers => {
  return headers.some(
    i => i.name === "content-type" && m3u8ContentType.includes(i.value)
  );
};
// 有些m3u8地址不是.m3u8后缀，而是从接口获取。通过响应头判断
chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    const { url, tabId, responseHeaders } = details;
    // 获取m3u8地址
    if (details.parentFrameId !== -1 && isMatchHeader(responseHeaders)) {
      console.warn("get:识别出视频地址", url, details);
      chrome.tabs.sendMessage(
        tabId,
        {
          operate: "finalVideoUrl",
          value: url,
          type: "m3u8",
        },
        function () {}
      );
    }
    // 去除cors校验
    if (details.parentFrameId === -1 && isMatchHeader(responseHeaders)) {
      console.warn("set:识别出视频地址", url, details);
      const top =
        details.initiator ||
        details.documentUrl ||
        details.originUrl ||
        details.url;
      // 开放cors。如果有多个，则只保留一个，否则部分网页报错
      // The ‘Access-Control-Allow-Origin‘ header contains multiple values‘x, *‘, but only one is allowed.
      // （不过这个多个报错，好像根据网页的配置表现不一。有的网页就不会报错，具体没细了解）
      const restHeaders = details.responseHeaders.filter(
        e =>
          e.name.toLowerCase() !== "access-control-allow-origin" &&
          e.name.toLowerCase() !== "access-control-allow-methods"
      );
      restHeaders.push({
        name: "Access-Control-Allow-Origin",
        // 不能使用"*"，不懂为什么，反正视频源会跨域
        value: top,
      });
      restHeaders.push({
        name: "Access-Control-Allow-Methods",
        value: "GET, PUT, POST, DELETE, HEAD, OPTIONS",
      });
      return {
        responseHeaders: restHeaders,
      };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking", "responseHeaders", "extraHeaders"]
);

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
    let allUrlList = [];
    plugins.forEach(item => {
      // 需要用到 plugin 里的 function，需自行调用 convertSourceObj
      const plugin = convertSourceObj(item.sourceCode);
      // 发送请求前拦截
      allUrlList = allUrlList.concat(plugin.url);
      const background = plugin?.network?.background;
      if (!background) return;
      // FIXME plugin.url现在支持数组了...（虽然支持多个，但网站的域名往往是同一个，所以这里刚好没出错，先不管了）
      const hostname = getHostname(plugin.url);
      const bgList = [].concat(background);
      bgList.forEach(bg => {
        // 请求完成拦截
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
    // 支持api伪装referrer
    beforeSendHeadersHandler(allUrlList);
  });
};

function beforeSendHeadersHandler(urlList) {
  if (!Array.isArray(urlList)) {
    urlList = [].concat(urlList);
  }
  chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
      const { initiator, url } = details;
      // 只匹配插件支持的网站，避免误伤
      const isDomainMatched = urlList.some(
        i => initiator && initiator.includes(getHostname(i))
      );
      const isUrlMatched = urlList.some(i => url.includes(i));
      const referrer = selectedApi.referrer;
      // OPTIMIZE 好像是可以直接return空的，这样这个回调相当于不起作用。文档没有看到这方面内容，还是先老老实实地return吧
      // 如果接口有需要指定referrer，则修改
      if (isDomainMatched && referrer && isUrlMatched) {
        console.log("符合条件被修改的url", url);
        let gotRef = false;
        for (let n in details.requestHeaders) {
          gotRef = details.requestHeaders[n].name.toLowerCase() == "referer";
          if (gotRef) {
            details.requestHeaders[n].value = referrer;
            break;
          }
        }
        if (!gotRef) {
          details.requestHeaders.push({ name: "Referer", value: referrer });
        }
      }
      return { requestHeaders: details.requestHeaders };
    },
    // 没办法根据发送请求的domain过滤，也不支持query参数过滤，只能全部拦截...这也许就是所谓的扩展越多、浏览器越卡的原因吧~
    {
      urls: ["<all_urls>"],
      // sub_frame表示embedded到document的frame。尽量减少影响
      types: ["sub_frame"],
    },
    ["requestHeaders", "blocking", "extraHeaders"]
  );
}

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
  let selectedSource = null;
  const config = await Config.get();
  if (typeof config.selectedSourceId === "undefined") {
    // 如果是第一次，默认开启并使用第一个源
    config.selectedSourceId = apiList[0].id;
    selectedSource = apiList[0];
    await Config.setObj(config);
  } else {
    const api = apiList.find(i => i.id === config.selectedSourceId);
    if (!api) {
      selectedSource = apiList[0];
      // api 不存在说明使用的源被删掉了，默认选中第一个源
      await Config.set("selectedSourceId", apiList[0].id);
    } else {
      selectedSource = api;
    }
  }

  // 将选中api存储到localStorage便于background.js自己同步使用
  window.updateStorageSelectedSource(selectedSource);

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
