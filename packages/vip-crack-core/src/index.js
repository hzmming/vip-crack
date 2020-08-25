import System from "@/core/System";
import Video from "@/core/Video";
import { convertSourceObj } from "shared/util";
import { log } from "shared/message";

const video = new Video();
const system = new System(video);

// 也不一定非得用 eventemitter 吧，毕竟我只想要派发，又不需要移除事件
const dispatchObj = {};

const listen = () => {
  window.addEventListener(
    "message",
    function (e) {
      if (typeof e.data.operate !== "undefined") {
        const fn = dispatchObj[e.data.operate];
        return fn && fn(e);
      }
    },
    false
  );
};
listen();

// 注册并启动脚本
dispatchObj.registerCrackPlugin = function (e) {
  // register
  const plugins = e.data.plugins;
  plugins.forEach(item => {
    const plugin = convertSourceObj(item.sourceCode);
    return system.use(plugin);
  });
  // start
  system.start();
};

// 获取源视频信息
dispatchObj.sourceInfo = function (e) {
  if (e.data.success) {
    system.resolveSourceInfo(e.data);
  }
};

// 不刷新页面下，切换集数
dispatchObj.resolveSourceInfo = function () {
  return video.blockPlay();
};
// 是否需要破解
dispatchObj.necessaryCrack = function (e) {
  if (e.data.necessaryCrack) {
    system.resolveNecessary();
    log("需要破解");
  } else {
    video.recoverPlay();
    log("非vip视频，正常播放");
  }
};
// 播放历史记录
dispatchObj.playHistoryTime = function (e) {
  if (!e.data.playHistoryTime) return;
  system.emit("playHistoryTime");
};
