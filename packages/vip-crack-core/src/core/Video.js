import { isHlsUrl } from "@/util";
import { log } from "shared/message";
import { deferred } from "shared/util";
const Hls = require("hls.js");

// 保证recoverPlay在blockPlay之后
let deferBlock = deferred();

class Video {
  /**
   * video 标签
   */
  dom = null;
  /**
   * video 原生播放方法
   */
  videoPlayFunc = null;
  /**
   * 播放信息
   */
  sourceInfo = null;
  setDom(videoDom) {
    this.dom = videoDom;
  }
  getDom() {
    return this.dom;
  }
  setSourceInfo(sourceInfo) {
    this.sourceInfo = sourceInfo;
  }
  blockPlay() {
    log("阻塞video.play()方法");
    const videoDom = this.dom;
    this.videoPlayFunc = videoDom.play.bind(videoDom);
    videoDom.play = () => {};
    videoDom.autoplay = false;
    deferBlock.resolve();
  }
  update() {
    this.dom.src = this.sourceInfo.url;
    log("已更新video地址");
  }
  async recoverPlay() {
    await deferBlock;
    deferBlock = deferred();
    log("还原video.play()方法");
    if (!this.videoPlayFunc) return;
    this.dom.play = this.videoPlayFunc;
    this.dom.autoplay = true;
    this.videoPlayFunc = null;
  }
  play() {
    // hls需特殊处理
    if (this.sourceInfo.type === "m3u8" || isHlsUrl(this.sourceInfo.url)) {
      return this.playHlsVideo();
    }
    this.dom.play();
    log("开始播放");
  }
  updateAndPlay() {
    this.update();
    this.recoverPlay();
    this.play();
  }
  playHlsVideo() {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(this.sourceInfo.url);
      hls.attachMedia(this.dom);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // 播放
        this.dom.play();
        log("开始播放");
      });
    } else {
      alert("不支持hls");
    }
  }
}

export default Video;
