import Config from "@/utils/Config";
import ApiUtil from "@/utils/ApiUtil";

/**
 * 数据同步后，失效api被删除，就会出现选中的id找不到对应的api。
 * 默认取第一条，并更新当前选中源
 */
export async function getActiveApi() {
  const [enable, apiList] = await Promise.all([
    Config.get("enable"),
    ApiUtil.get()
  ]);
  let api = apiList.find(i => i.id === enable);
  if (!api) {
    api = apiList[0];
    await Config.set("selectedSource", api.id);
  }
  return api;
}
