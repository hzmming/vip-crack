import Config from "@/utils/Config";
import ApiUtil from "@/utils/ApiUtil";

/**
 * 获取当前选中的Api
 * FIXME 设计不合理的缺陷，日后改
 * 数据同步后，失效api被删除，就会出现选中的id找不到对应的api。
 * 默认取第一条，并更新当前选中源
 */
export async function getActiveApi() {
  return new Promise(resolve => {
    (async () => {
      const [selectedSourceId, apiList] = await Promise.all([
        Config.get("selectedSourceId"),
        ApiUtil.get(),
      ]);
      let api = apiList.find(i => i.id === selectedSourceId);
      if (!api) {
        api = apiList[0];
        await Config.set("selectedSourceId", api.id);
      }
      resolve(api);
    })();
  });
}

export async function sendMessage(message) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, response => {
      resolve(response);
    });
  });
}

export async function sync() {
  const message = { operate: "sync" };
  if (chrome.extension) {
    // 来自 popup 或者 options。二者与 background 的通信方式不一样
    const background = chrome.extension.getBackgroundPage();
    return await background.dispatchAction(message);
  } else {
    return await sendMessage(message);
  }
}
