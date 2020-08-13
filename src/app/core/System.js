import { hasOwnProperty, deferred } from "@/utils/helps";
import { isSuit } from "@/utils/helps";
import { proxy } from "ajax-hook";
import * as JSONPHook from "@/vendor/JSONPHook";

const LIFECYCLE_HOOKS = [
  "init",
  "beforeGetVideoDom",
  "getVideoDom",
  "afterGetVideoDom",
  "afterPlay",
  "playHistoryTime"
];

const createNoReferrerMeta = () => {
  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "no-referrer";
  return meta;
};

let noReferrerMeta = createNoReferrerMeta();

/**
 * 禁用Referrer
 * QUESTION 不知道会不会影响
 */
const disableReferrer = () => {
  document.head.appendChild(noReferrerMeta);
};

const recoverReferrer = () => {
  noReferrerMeta.remove();
};

class System {
  videoDefer = deferred();
  sourceInfoDefer = deferred();
  necessaryDefer = deferred();
  ready = null;
  video = null;
  hooks = {};
  constructor(video) {
    this.video = video;
    this.ready = Promise.all([
      this.videoDefer,
      this.sourceInfoDefer,
      this.necessaryDefer
    ]);
    this.initHooks();
  }
  initHooks() {
    LIFECYCLE_HOOKS.forEach(name => {
      this.hooks[name] = [];
    });
  }
  use(pluginObj) {
    // 判断插件是否适用当前网站
    if (!isSuit(pluginObj)) return;
    const plugin = pluginObj.core;
    for (let key in plugin) {
      if (hasOwnProperty(plugin, key)) {
        this.hooks[key] && this.hooks[key].push(plugin[key]);
      }
    }
    // 拦截请求
    this.hookNetwork(pluginObj.network);
  }
  emit(key, options) {
    const fns = this.hooks[key];
    fns && fns.forEach(fn => fn(this, options));
  }
  async start() {
    this.emit("init");
    this.emit("beforeGetVideoDom");
    this.emit("getVideoDom", { resolve: this.resolveVideoDom.bind(this) });
    await this.ready;
    this.video.updateAndPlay();
    // 重置是否需要破解标志，为不刷新页面切换集数准备
    this.necessaryDefer = deferred();
    this.emit("afterPlay");
  }
  hookNetwork(network = {}) {
    const { injected } = network;
    if (!injected) return;
    const array = [].concat(injected);
    const resolveNecessary = (necessaryCrack, options) => {
      window.postMessage({ operate: "necessaryCrack", necessaryCrack }, "*");
      options.referrer ? disableReferrer() : recoverReferrer();
    };
    array.forEach(i => {
      if (i.type === "ajax") {
        proxy({
          //请求成功后进入
          onResponse: (response, handler) => {
            const url = response.config.url;
            const matchList = [].concat(i.url);
            const isMatch = matchList.some(match => {
              if (i.operator === "equal") {
                return url === match;
              }
              // 默认 include
              return url.includes(match);
            });
            isMatch && i.handler(response, resolveNecessary);
            handler.next(response);
          }
        });
      } else if (i.type === "jsonp") {
        const matchList = [].concat(i.url);
        JSONPHook(
          matchList,
          response => {
            i.handler(response, resolveNecessary);
            // TODO 采用类似 ajaxhook 的 handler.next(response) 重构
            return response;
          },
          "callback"
        );
      }
    });
  }
  getVideoDom() {
    return this.video.getDom();
  }
  resolveVideoDom(videoDom) {
    this.video.setDom(videoDom);
    this.video.blockPlay();
    this.emit("afterGetVideoDom");
    this.videoDefer.resolve();
  }
  resolveNecessary() {
    this.necessaryDefer.resolve();
  }
  resolveSourceInfo(sourceInfo) {
    this.video.setSourceInfo(sourceInfo);
    if (sourceInfo.immediate) {
      this.necessaryDefer.then(() => {
        this.video.updateAndPlay();
      });
    }
    this.sourceInfoDefer.resolve();
  }
}

export default System;
