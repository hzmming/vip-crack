import PluginUtil from "@/utils/PluginUtil";
import Config from "@/utils/Config";
import crossRequest from "@/utils/crossRequest";
import notice from "@/utils/notice";
import { getActivePlugins, deferred, generateRequestParams } from "shared/util";
import { log, error } from "shared/message";
import { getActiveApi } from "@/utils";
import { API } from "@/constants";

let changeEpisode = false;
let iframe = null;

const dispatchBrowserObj = {};
const listenBrowser = () => {
  window.addEventListener(
    "message",
    function (e) {
      if (typeof e.data.operate !== "undefined") {
        const fn = dispatchBrowserObj[e.data.operate];
        return fn && fn(e);
      }
    },
    false
  );
};

const dispatchBackgroundObj = {};
const listenBackground = () => {
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (typeof request.operate !== "undefined") {
      const fn = dispatchBackgroundObj[request.operate];
      return fn && fn(request, sender, sendResponse);
    }
  });
};

let necessaryDefer = deferred();

const main = () => {
  // 1. 获取插件
  PluginUtil.get().then(async plugins => {
    log("所有插件", plugins.length);
    let activePlugins = getActivePlugins(plugins);
    if (!activePlugins.length) return;
    log("匹配插件", activePlugins.length);
    // 过滤未启用的插件
    const config = await Config.get();
    activePlugins = activePlugins.filter(i => config.enableObj[i.name]);
    log("启用插件", activePlugins.length);
    if (activePlugins.length) {
      // 2. 点亮图标
      chrome.runtime.sendMessage({ operate: "enableVipCrack", value: true });
      // 3. 启动破解
      window.postMessage(
        { operate: "registerCrackPlugin", plugins: activePlugins },
        "*"
      );
      // 4. 消息处理
      // injected消息
      listenBrowser();
      // background消息
      listenBackground();
      // 5.创建视频解析器
      createParser();
      // TODO 6. 一开始在background.js里立即判断并做定时器是对的，后来想錯了，先这样吧
      chrome.runtime.sendMessage({ operate: "checkForUpdate" });
    }
  });
};
// EOP
main();

dispatchBrowserObj["resolveSourceInfo"] = () => {
  changeEpisode = true;
  log("换集");
  createParser();
};

dispatchBrowserObj["necessaryCrack"] = e => {
  if (e.data.necessaryCrack) {
    necessaryDefer.resolve();
  } else {
    necessaryDefer.reject();
    removeParser();
  }
  necessaryDefer = deferred();
};

dispatchBackgroundObj["playHistoryTime"] = () => {
  window.postMessage({ playHistoryTime: true }, "*");
};

dispatchBackgroundObj["finalVideoUrl"] = ({ value }) => {
  // 有的接口莫名其妙返回两个可播放地址，只用第一个
  if (!iframe) return;
  log("解析成功，地址为" + value);
  // 通知crack.js执行破解
  window.postMessage(
    {
      operate: "sourceInfo",
      url: value,
      success: true,
      // OPTIMIZE immediate的存在有点问题，无非就是第一次要等所有条件达成，而第二次只需判断是否破解和是否解析成功
      immediate: changeEpisode,
    },
    "*"
  );
  removeParser();
};

async function createParser() {
  // 创建iframe
  iframe = document.createElement("iframe");

  // 隐藏
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "0px";
  iframe.style.height = "0px";

  const api = await getActiveApi();
  log("当前所使用的api为", api.name);

  const videoUrl = location.origin + location.pathname; // 视频多带的参数有可能造成解析失败
  iframe.src = api.url + videoUrl;

  // 添加至document
  document.documentElement.appendChild(iframe);
  log("创建iframe");
}

function removeParser() {
  iframe && iframe.remove();
  iframe = null;
  log("删除iframe");
}

/**
 * DEPRECATED 采用新的方式实现，不需要源地址api了
 * 获取视频解析信息
 */
// eslint-disable-next-line no-unused-vars
async function resolveSourceInfo(immediate) {
  // 获取视频真实地址
  const videoUrl = location.origin + location.pathname; // 腾讯视频多带的参数有可能造成解析失败

  const api = await getActiveApi();
  const { url, options } = generateRequestParams(videoUrl, api);
  const res = await crossRequest(url, options);

  if (!res || !res.success) {
    error(API.ERROR);
    return necessaryDefer.then(() => notice.error(API.ERROR));
  }

  if (res.player === "url") {
    return necessaryDefer.then(() => notice.error("url类型，暂不支持，待完善"));
  }

  if (!["mp4", "hls", "m3u8"].includes(res.type))
    necessaryDefer.then(() =>
      notice.warning(
        `类型${res.type}的视频未验证过，可能失败，如果不行，请联系844155285hzm@gmail.com`
      )
    );

  log("解析成功，类型为" + res.type);
  log("地址为" + res.url);

  // 通知crack.js执行破解
  window.postMessage({ operate: "sourceInfo", immediate, ...res }, "*");
}
