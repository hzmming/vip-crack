import PluginUtil from "@/utils/PluginUtil";
import { getHostname, convertSourceObj, hourToMillisecond } from "shared/util";
import ApiUtil from "./utils/ApiUtil";
import Config from "./utils/Config";

const dispatchObj = {};

const listen = () => {
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (sender.tab && typeof request.operate !== "undefined") {
      const fn = dispatchObj[request.operate];
      return fn && fn(request, sender, sendResponse);
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
      128: `/icons/128${status ? "" : "-gray"}.png`,
    },
  });
};

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

/**
 * 网络请求拦截
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

/**
 * 同步插件和Api列表
 * 一天至少一次请求获取
 * TODO 多久更新应支持配置
 */
const sync = () => {
  chrome.storage.local.get(["lastUpdatedTime"], async ({ lastUpdatedTime }) => {
    const currentTime = new Date().getTime();
    if (lastUpdatedTime) {
      // 判断相隔是否超过一天，超过则更新
      const interval = currentTime - lastUpdatedTime;
      // 需要更新的间隔时间（单位：ms）
      const needToUpdateInterval = 1 * 24 * 60 * 60 * 1000;
      const currentInterval = interval - needToUpdateInterval;
      if (currentInterval < 0) {
        // 定时，时间到了，就更新
        setTimeout(async () => {
          await Promise.all([PluginUtil.sync(), ApiUtil.sync()]);
          chrome.storage.local.set({
            lastUpdatedTime,
          });
        }, Math.abs(currentInterval));
        // TODO 此处代码分支写得有点乱，需重构
        proxyNetwork();
        return;
      }
    }
    const [, apiList] = await Promise.all([PluginUtil.sync(), ApiUtil.sync()]);
    chrome.storage.local.set({
      lastUpdatedTime: currentTime,
    });
    // 如果是第一次，默认开启并使用第一个源
    const config = await Config.get();
    if (typeof config.enable === "undefined") {
      config.enable = true;
      config.selectedSourceId = apiList[0].id;
      await Config.setObj(config);
    } else {
      const api = apiList.find(i => i.id === config.selectedSourceId);
      if (!api) {
        // api 不存在说明使用的源被删掉了，默认选中第一个源
        await Config.set("selectedSourceId", apiList[0].id);
      }
    }
    proxyNetwork();
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
  // 第一次，同步
  sync();
});
