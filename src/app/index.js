import System from "./core/System";
import Video from "./core/Video";

export default () => {
  const video = new Video();
  const system = new System(video);

  // 也不一定非得用 eventemitter 吧，毕竟我只想要派发，又不需要移除事件
  const dispatchObj = {};

  const listen = () => {
    window.addEventListener(
      "message",
      function (e) {
        const fn = dispatchObj[e.data.operate];
        fn && fn(e);
      },
      false
    );
  };
  listen();

  // 注册并启动脚本
  dispatchObj.register = function (e) {
    if (e.data.registerCrackPlugin) {
      // register
      const plugins = e.data.plugins;
      const pluginsName = Object.keys(plugins);
      pluginsName.forEach(name => {
        system.use(plugins[name]);
      });
      // start
      system.start();
    }
  };

  // 获取源视频信息
  dispatchObj.sourceInfo = function (e) {
    if (e.data.crack && e.data.success) {
      system.resolveSourceInfo(e.data);
    }
  };

  // 不刷新页面下，切换集数
  dispatchObj.updateSrc = function (e) {
    if (e.data.updateSrc) {
      return video.blockPlay();
    }
  };
  // 是否需要破解
  dispatchObj.necessaryCrack = function (e) {
    if (typeof e.data.necessaryCrack !== "undefined") {
      if (e.data.necessaryCrack) {
        system.resolveNecessary();
      } else {
        video.recoverPlay();
        console.log("非vip视频，正常播放");
      }
      return;
    }
  };
  // 播放历史记录
  dispatchObj.playHistoryTime = function (e) {
    if (!e.data.playHistoryTime) return;
    system.emit("playHistoryTime");
  };
};
