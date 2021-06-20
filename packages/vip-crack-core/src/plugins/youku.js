import { getPrototype } from "shared/util";
import { log } from "shared/message";
import { hackAppendChild, hookApply, wrapperInstaller } from "@/util";

const mockStream = [
  {
    audio_lang: "ja",
    milliseconds_audio: 1442950,
    milliseconds_video: 1442830,
    segs: [],
    stream_ext: {
      hls_subtitle: "default",
      fps: 30,
      hls_size: 63806260,
      hls_duration: 1442833,
      hls_oss_bucket: 2,
      startTime: "2.800000",
      one_seg_flag: 0,
      hls_logo: "none",
      oss_bucket: 2,
    },
    size: 57462855,
    subtitle_lang: "default",
    media_type: "standard",
    stream_type: "mp4sd",
    width: 640,
    logo: "none",
    m3u8_url: "-1",
    height: 360,
  },
];

const network = {
  injected: {
    handler(res, resolveNecessary) {
      // 判断是否需要破解
      const necessaryCrack = !res.data.data.controller.buy_guide;
      resolveNecessary(necessaryCrack, {
        referrer: necessaryCrack,
      });
      const user = res.data.data.user;
      user && (user.vip = true);
      delete res.data.data.trial;
      delete res.data.data.error;
      delete res.data.data.ad;

      // 补漏
      if (necessaryCrack) {
        const stream = res.data.data.stream;
        if (stream && !stream.length) res.data.data.stream = mockStream;
      }

      // 一定要返回原参数，且多个参数使用数组返回
      return res;
    },
    url: "acs.youku.com/h5/mtop.youku.play.ups.appinfo.get/1.1/",
    type: "jsonp",
  },
};

const core = {
  init() {
    /**
     * 有些电影播放有问题，出现canvas标签播放而不是video标签，使用canvas好像是h.265的标准，更省流量，
     * 但人家原先正常播放用的是video，是被我改了什么参数，逻辑错乱才变成canvas的
     *
     * 错误示例：https://v.youku.com/v_show/id_XNDgwNjE1NjI3Mg==.html
     * hack的核心逻辑在于链：youku-player._createVideo => this.args.useH265 => youku-player._adaptPlayerConfig => this.h265CanUse => this._h265Enable()
     * _h265Enable() 里有好多判断逻辑，不管改哪个，重点是要让该方法返回“false”
     * QUESTION 直接把这方法覆盖掉不知道会不会有问题
     */
    Object.defineProperty(window, "H265Player", {
      get() {
        return undefined;
      },
    });
  },
  getVideoDom(ctx, { resolve }) {
    const done = hackAppendChild((...args) => {
      if (args[0].nodeName !== "VIDEO") return;
      resolve(args[0]);
      done();
    });
  },
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
    // 电影不一定有下一集播放，而且电影和综艺的页面结构不一样。不想管理了,try catch
    try {
      fixClickPlayNext();
      fixEndPlayNext();
    } catch (e) {
      log("error，目前只做了动漫的下一集播放，电影、综艺暂不管");
      // console.error(e);
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
  },
};

wrapperInstaller({
  name: "youku",
  nickname: "优酷视频",
  description: "",
  url: "v.youku.com/v_show",
  version: "0.0.3",
  network,
  core,
});
