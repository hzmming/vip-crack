import {
  hackCreateElement,
  filterDomEvt,
  hookPushState,
  wrapperInstaller
} from "../util";

const network = {
  // 在 chrome extension 的 background.js 运行。支持 Object 或 Array
  background: {
    // 支持 String 或 Array
    url: "node.video.qq.com/x/api/specify_history",
    // 支持：equal, include。默认值为：include
    operator: "include",
    // 请求结束后，发送消息。强制 Object
    message: {
      operate: "playHistoryTime"
    }
  },
  // 在 浏览器客户端 运行。支持 Object 或 Array
  injected: {
    /**
     * 若该请求为“是否破解”关键请求，需执行 resolveNecessary(param: Boolean | Object, options?: Object) 表示是否需要破解
     * param: 支持Boolean表示是否破解
     * options: {
     *  referrer: false 表示屏蔽 referrer
     * }
     */
    handler(response, resolveNecessary) {
      const res = response.response && JSON.parse(response.response);
      if (res && res.vinfo) {
        const vinfo = JSON.parse(res.vinfo);
        // 判断是否需要破解
        const necessaryCrack = isNeedCrack(vinfo.vl.vi[0].st);
        // TODO 其实目前只要破解都是直接屏蔽掉referrer啦，因为还没找到在chrome extension时去除的方法
        resolveNecessary(necessaryCrack, { referrer: necessaryCrack });
        vinfo.vl.vi[0].st = 2;
        vinfo.preview = 0;
        res.vinfo = JSON.stringify(vinfo);
        // 屏蔽广告
        delete res.ad;
        response.response = JSON.stringify(res);
      }

      function isNeedCrack(status) {
        return status !== 2;
      }
    },
    // 支持 String 或 Array
    url: ["https://vd.l.qq.com/proxyhttp", "https://vi.l.qq.com/proxyhttp"],
    // 支持：equal, include。默认值为：include
    operator: "include",
    // 支持：ajax, jsonp。默认值为：ajax
    type: "ajax"
  }
};

const core = {
  init() {
    hookPushState(() => {
      window.postMessage({ resolveSourceInfo: true }, "*");
    });
  },
  beforeGetVideoDom() {},
  getVideoDom(ctx, { resolve }) {
    const done = hackCreateElement((...args) => {
      if (args[0].toLowerCase() !== "video") return;
      const videoDom = document.querySelector("video");
      // 判断条件：页面第一个video标签
      videoDom && resolve(videoDom);
      done();
    });
  },
  afterGetVideoDom(ctx) {
    filterDomEvt(ctx.getVideoDom(), "error");
  },
  playHistoryTime(ctx) {
    const videoDom = ctx.getVideoDom();
    setTimeout(() => {
      const clickTipsDom = document.querySelector("[data-action=clickTips]");
      if (!clickTipsDom) return videoDom.play();
      const time = clickTipsDom.innerText;
      const [hour = 0, minute = 0, second = 0] = Array(3)
        .concat(time.split(":"))
        .map(i => parseInt(i))
        .splice(-3);
      videoDom.currentTime = hour * 60 * 60 + minute * 60 + second;
      videoDom.play();
    }, 800);
    return;
  }
};

/**
 * 因为脚本是动态远程获取的，没办法像本地一样import并使用，所以在window上挂载了全局变量，采用了自注册的方式
 */
wrapperInstaller({
  // 插件名称
  name: "qq",
  // 指定网站使用插件，强制只到一级域名：其实qq的全url是 v.qq.com/x/cover，但咱们只要写到qq这级即可
  url: "qq.com/x/cover",
  // 版本号
  version: "0.0.1",
  network,
  core
});
