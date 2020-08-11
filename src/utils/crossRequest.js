/**
 * 跨域请求
 * @param {请求地址} url
 * @param {参数} params
 */
export default function crossRequest(url, params) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      {
        isRequest: true,
        url,
        params
      },
      function (response) {
        resolve(response);
      }
    );
  });
}
