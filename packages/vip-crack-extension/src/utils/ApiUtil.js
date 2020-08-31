import { uuid } from "shared/util";
import config from "@/config.json";

/**
 * 接口类。负责解析接口相关操作，包括导入、导出、同步、新增、编辑、删除等
 */
class ApiUtil {
  static import() {
    // 导入应该是用普通的 input type="file" 就行
  }
  static async export() {
    const apiList = await ApiUtil.getCustom();
    const result = JSON.stringify(apiList);

    // https://stackoverflow.com/questions/23160600/chrome-extension-local-storage-how-to-export
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
    const url = "data:," + result;
    // 记得添加 downloads 权限
    chrome.downloads.download({
      url: url,
      filename: "apiList.txt",
    });
  }
  static sync() {
    // 查看仓库代码是否更新
    // 若更新，则同步
    return new Promise(resolve => {
      let { apiListPath } = config;
      if (process.env.ENV === "local") {
        apiListPath = chrome.extension.getURL(apiListPath.split("/").pop());
      }
      fetch(apiListPath)
        .then(res => res.json())
        .then(async ({ list }) => {
          // 添加唯一id
          const temp = list.map((i, index) => {
            return {
              url: i,
              id: uuid(),
              name: `接口 ${index + 1}`,
            };
          });
          const apiList = await ApiUtil.get();
          const manualList = apiList.filter(i => i.manual);
          // 保留用户手动添加的
          const mergeList = manualList.concat(temp);
          await ApiUtil.override(mergeList);
          resolve(mergeList);
        });
    });
  }
  static async create(items) {
    const apiList = await ApiUtil.get();
    const manualIndex = apiList.filter(i => i.manual).length;
    const list = [].concat(items);
    list.filter(i => {
      i.id = uuid();
      // 用户手动添加的
      i.manual = true;
      // 允许用户不给名字，自动生成一个
      i.name = i.name || `自定义 ${manualIndex + 1}`;
    });
    apiList.unshift(...list);
    return ApiUtil.override(apiList);
  }
  static async update(item) {
    const apiList = await ApiUtil.get();
    const target = apiList.find(i => i.id === item.id);
    if (target) {
      Object.assign(target, item);
      return ApiUtil.override(apiList);
    }
    return Promise.reject("没有该对象");
  }
  static async remove(items) {
    let apiList = await ApiUtil.get();
    const list = [].concat(items);
    apiList = apiList.filter(i => !list.find(item => item.id === i.id));
    return ApiUtil.override(apiList);
  }
  static get({ id } = {}) {
    return new Promise(resolve => {
      chrome.storage.sync.get({ apiList: [] }, ({ apiList }) => {
        const result =
          typeof id !== "undefined" ? apiList.find(i => i.id === id) : apiList;
        resolve(result);
      });
    });
  }
  static async getCustom() {
    const list = await ApiUtil.get();
    return list.filter(i => i.manual);
  }
  static async override(apiList) {
    return new Promise(resolve => {
      chrome.storage.sync.set(
        {
          apiList,
        },
        () => resolve(true)
      );
    });
  }
}

export default ApiUtil;
