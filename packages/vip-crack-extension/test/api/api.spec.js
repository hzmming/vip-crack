const { list: apiList } = require("../../src/apiList.json");
const fetch = require("node-fetch");

jest.setTimeout(15 * 1000);

describe("api", () => {
  it("should request successful", async () => {
    const errorList = [];
    const successList = [];
    for (let i = 0; i < apiList.length; i++) {
      const url = apiList[i];
      const result = await fetch(url).catch(() => {
        errorList.push(url);
      });
      if (!result) continue;
      if (result.ok) {
        successList.push(url);
      } else {
        errorList.push(url);
      }
    }
    // 保证可达即可
    errorList.length &&
      console.log("以下api均已不可用：\n", errorList.join("\n"));

    console.log("可用api如下：\n", successList.join("\n"));
    expect(errorList.length).toBe(0);
  });
});
