import PluginUtil from "@/utils/PluginUtil";
import crossRequest from "@/utils/crossRequest";
import notice from "@/utils/notice";
import { getActivePlugins, deferred, queryStringify } from "@/utils/helps";

const dispatchBrowserObj = {};
const listenBrowser = () => {
  window.addEventListener(
    "message",
    function (e) {
      const fn = dispatchBrowserObj[e.data.operate];
      fn && fn(e);
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
    const fn = dispatchBackgroundObj[request.operate];
    fn && fn(request, sender, sendResponse);
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
    }
  });
};
// EOP
main();

dispatchBrowserObj["updateSrc"] = e => {
  if (typeof e.data.updateSrc !== "undefined") {
    updateVideoSrc(e.data.updateSrc);
    return;
  }
  if (typeof e.data.necessaryCrack !== "undefined") {
    e.data.necessaryCrack ? necessaryDefer.resolve() : necessaryDefer.reject();
    necessaryDefer = deferred();
    return;
  }
};

const analysisApis = {
  // 效果一般
  one: {
    url: "https://app.tf.js.cn/jxds/api.php",
    param: "url"
  },
  // 效果不错，但优酷的电影不支持
  two: {
    url: "https://jx.idc126.net/jx/api.php",
    method: "POST",
    param: "url",
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "zh-CN,zh;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      pragma: "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest"
    }
  },
  three: {
    url: "http://v.idc126.net/v/api.php",
    method: "POST",
    param: "url",
    headers: {
      Host: "v.idc126.net",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Origin: "http://v.idc126.net",
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Content-Length": "70",
      "Content-Type": "application/x-www-form-urlencoded",
      Connection: "keep-alive"
    }
  }
};

function generateRequestParams(videoUrl, { url, method, param, headers }) {
  const isPost = method === "POST";
  const keyParam = queryStringify({ [param]: videoUrl });
  const options = {
    url: url + (isPost ? "" : `?${keyParam}`),
    options: {
      method: method || "GET",
      headers: headers || {},
      body: isPost ? keyParam : null
    }
  };
  return options;
}

/**
 * 更新video为视频源地址
 */
async function updateVideoSrc(immediate) {
  // 获取视频真实地址
  const videoUrl = location.origin + location.pathname; // 腾讯视频多带的参数有可能造成解析失败

  const { url, options } = generateRequestParams(
    videoUrl,
    analysisApis["three"]
  );
  const res = await crossRequest(url, options);
  // const res = await crossRequest("https://jx.idc126.net/jx/api.php", {
  //   method: "POST",
  //   headers: {
  //     accept: "application/json, text/javascript, */*; q=0.01",
  //     "accept-language": "zh-CN,zh;q=0.9",
  //     "cache-control": "no-cache",
  //     "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  //     pragma: "no-cache",
  //     "sec-fetch-dest": "empty",
  //     "sec-fetch-mode": "cors",
  //     "sec-fetch-site": "same-origin",
  //     "x-requested-with": "XMLHttpRequest",
  //   },
  //   body: queryStringify(data),
  // });
  // const res = await crossRequest("https://v.7cyd.com/vip/?url=" + data.url);

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

  // notice.error("解析成功，类型为" + res.type);
  console.log("解析成功，类型为" + res.type);

  // 通知crack.js执行破解
  window.postMessage({ crack: true, immediate, ...res }, "*");
}
