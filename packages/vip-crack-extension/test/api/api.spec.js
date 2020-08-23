const { list: apiList } = require("../../src/apiList.json");
const { generateRequestParams } = require("shared/util");
const fetch = require("node-fetch");

// 《命运石之门》第2集
const videoUrl = "https://v.qq.com/x/cover/gvz5bapszkkjbw8/b0026nzjshz.html";

describe("api", () => {
  it("should request successful", async () => {
    for (let i = 0; i < apiList.length; i++) {
      const { url, options } = generateRequestParams(videoUrl, apiList[i].api);
      const res = await fetch(url, options);
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        console.error(e);
      }
      expect(data && data.success).toBeTruthy();
    }
  });
});
