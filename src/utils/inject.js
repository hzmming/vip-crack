/**
 * 注入脚本
 * 注意：使用此方式，需将注入脚本添加到 manifest.json 的 web_accessible_resources 字段，否则报错 chrome-extension://invalid/
 * @param {文件路径} jsPath
 */
export default jsPath => {
  var temp = document.createElement("script");
  temp.async = false;
  temp.setAttribute("type", "text/javascript");
  /**
   * 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
   */
  temp.src = chrome.extension.getURL(jsPath);
  temp.onload = function () {
    // 放在页面不好看，执行完后移除掉
    this.parentNode.removeChild(this);
  };
  /**
   * 注入脚本的上下文和网页的上下文是不一样的，也就是说直接修改window是不起作用的...
   * 但是因为共用一个document，所以可以通过注入script曲线救国
   * 注意：如果执行时机是document_start，此时页面只有一个html标签，head都不存在，所以script应直接append到html上
   * （web_accessible_resources需要允许注入的脚本，不然会加载失败的！！！）
   */
  document.documentElement.appendChild(temp);
};
