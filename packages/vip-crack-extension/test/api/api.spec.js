const { list: apiList } = require("../../src/apiList.json");
const fetch = require("node-fetch");

jest.setTimeout(15 * 1000);

describe("api", () => {
  it("should request successful", async () => {
    for (let i = 0; i < apiList.length; i++) {
      const result = await fetch(apiList[i]);
      console.log(result.ok, apiList[i]);
      // 保证可达即可
      expect(result.ok).toBeTruthy();
    }
  });
});
