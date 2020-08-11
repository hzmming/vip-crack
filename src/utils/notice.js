/**
 * 只给 content.js 使用
 * TODO injected.js 怎么使用
 */
function Notice(options = {}) {
  // chrome.notifications 只在 background.js 使用，使用 sendMessage 通信
  // TODO 只做了error，其它情况待续
  const params = {
    type: "basic",
    iconUrl: "images/fail.jpg", // 简单地贴个失败图片
    title: ""
  };
  params.message = options.message;
  chrome.runtime.sendMessage({
    isNotice: true,
    params
  });
}

["success", "warning", "info", "error"].forEach(type => {
  Notice[type] = options => {
    if (typeof options === "string") {
      options = {
        message: options
      };
    }
    options.type = type;
    return Notice(options);
  };
});

export default Notice;
