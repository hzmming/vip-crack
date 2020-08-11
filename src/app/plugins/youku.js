import { getPrototype, hookApply } from "../util";

const network = {
  injected: {
    handler(res, resolveNecessary) {
      // 判断是否需要破解
      const necessaryCrack = !res.data.data.controller.buy_guide;
      resolveNecessary(necessaryCrack, {
        referrer: necessaryCrack
      });
      const user = res.data.data.user;
      user && (user.vip = true);
      delete res.data.data.trial;
      delete res.data.data.error;
      delete res.data.data.ad;
      // 一定要返回原参数，且多个参数使用数组返回
      return res;
    },
    url: "acs.youku.com/h5/mtop.youku.play.ups.appinfo.get/1.1/",
    type: "jsonp"
  }
};

const core = {
  afterGetVideoDom() {
    // 这是一个思路，但有些情况未覆盖到，所以弃用
    /* hookPromise({
      catchHook(err) {
        if (
          getPrototype(err) === "Error" &&
          err.toString().includes("请求-1时超时")
        ) {
          return false;
        }
      },
    }); */
    hookApply(function (...args) {
      let param = args[0];
      if (
        param &&
        getPrototype(param) === "Error" &&
        /manifest(.*?)解析失败/.test(param.toString())
      ) {
        return false;
      }
    });
  },
  /**
   * 优酷这破网站真是折腾死我
   * 由于视频信息的url地址为-1（没有播放权限，地址都不给了），造成代码直接异常，
   * 所以有些事件没有完整绑定，如：播放下一个视频，体现在
   *  a.播放下一个按钮失效
   *  b.视频结束后不会自动续播
   * 手动补上。。。
   */
  afterPlay(ctx) {
    // 不知道会不会出现节点不存在情况，不想管理了,try catch
    try {
      fixClickPlayNext();
      fixEndPlayNext();
    } catch (e) {
      console.error(e);
    }

    function fixClickPlayNext() {
      // 播放下一个视频按钮
      const nextBtnDom = document.querySelector(
        ".h5player-dashboard .h5-control-wrap .control-next-video .icon-next"
      );
      // 右侧选集当前播放视频节点
      const playingDom = document.querySelector(
        ".anthology-content .current-mask"
      ).parentNode;
      // 右侧选集下一视频节点
      const nextPlayDom = playingDom.nextSibling;
      // click触发播放下一视频
      nextBtnDom.onclick = () => nextPlayDom.click();
    }

    function fixEndPlayNext() {
      const videoDom = ctx.getVideoDom();
      // 视频播放结束事件
      videoDom.onended = () => {
        // 播放下一个视频按钮
        const nextBtnDom = document.querySelector(
          ".h5player-dashboard .h5-control-wrap .control-next-video .icon-next"
        );
        nextBtnDom.click();
      };
    }
  }
};

export default {
  name: "youku",
  url: "v.youku.com/v_show",
  version: "0.0.1",
  network,
  core
};
