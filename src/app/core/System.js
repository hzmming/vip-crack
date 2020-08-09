import { hasOwnProperty, deferred } from "../util";

const LIFECYCLE_HOOKS = [
  "beforeGetVideoDom",
  "getVideoDom",
  "afterGetVideoDom",
  "afterPlay",
  "playHistoryTime"
];

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
      this.hooks[name] = {};
    });
  }
  use(plugin) {
    for (let key in plugin) {
      if (hasOwnProperty(plugin, key)) {
        this.hooks[key] && this.hooks[key].push(plugin[key]);
      }
    }
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
    this.emit("afterPlay");
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
