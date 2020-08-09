import { isHlsType } from "../util";

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
    const videoDom = this.dom;
    this.videoPlayFunc = videoDom.play.bind(videoDom);
    videoDom.play = () => {};
    videoDom.autoplay = false;
  }
  update() {
    this.dom.src = this.sourceInfo.url;
  }
  recoverPlay() {
    if (!this.videoPlayFunc) return;
    this.dom.play = this.videoPlayFunc;
    this.dom.autoplay = true;
    this.videoPlayFunc = null;
  }
  play() {
    // hls需特殊处理
    if (isHlsType(this.sourceInfo.type)) {
      return this.playHlsVideo();
    }
    this.dom.play();
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
      });
    } else {
      alert("不支持hls");
    }
  }
}

export default Video;
