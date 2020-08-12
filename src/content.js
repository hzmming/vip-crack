import PluginUtil from "@/utils/PluginUtil";
import crossRequest from "@/utils/crossRequest";
import notice from "@/utils/notice";
import {
  getActivePlugins,
  deferred,
  generateRequestParams
} from "@/utils/helps";
import { getActiveApi } from "@/utils";

const dispatchBrowserObj = {};
const listenBrowser = () => {
  window.addEventListener(
    "message",
    function (e) {
      if (typeof e.data.operate !== "undefined") {
        const fn = dispatchBrowserObj[e.data.operate];
        fn && fn(e);
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
      fn && fn(request, sender, sendResponse);
    }
  });
};

let necessaryDefer = deferred();

const main = () => {
  // 1. 获取插件
  PluginUtil.get().then(plugins => {
    const activePlugins = getActivePlugins(plugins);
    if (activePlugins.length) {
      // 2. 点亮图标
      chrome.runtime.sendMessage({ operate: "enableVipCrack" });
      // 3. 启动破解
      window.postMessage(
        { registerCrackPlugin: true, plugins: activePlugins },
        "*"
      );
      // 4. 消息处理
      // injected消息
      listenBrowser();
      // background消息
      listenBackground();
      // 5. 获取视频解析信息
      resolveSourceInfo();
    }
  });
};
// EOP
main();

dispatchBrowserObj["resolveSourceInfo"] = e => {
  resolveSourceInfo(e.data.resolveSourceInfo);
};

dispatchBrowserObj["necessaryCrack"] = e => {
  e.data.necessaryCrack ? necessaryDefer.resolve() : necessaryDefer.reject();
  necessaryDefer = deferred();
};

dispatchBackgroundObj["playHistoryTime"] = () => {
  window.postMessage({ playHistoryTime: true }, "*");
};

/**
 * 获取视频解析信息
 */
async function resolveSourceInfo(immediate) {
  // 获取视频真实地址
  const videoUrl = location.origin + location.pathname; // 腾讯视频多带的参数有可能造成解析失败

  const api = await getActiveApi();
  const { url, options } = generateRequestParams(videoUrl, api);
  const res = await crossRequest(url, options);

  if (!res.success) {
    return necessaryDefer.then(() =>
      notice.error(
        "解析失败，请重新刷新页面。若还是不行，请联系844155285hzm@gmail.com"
      )
    );
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

  console.log("解析成功，类型为" + res.type);

  // 通知crack.js执行破解
  window.postMessage({ operate: "sourceInfo", immediate, ...res }, "*");
}
