import "expect-puppeteer";
import {
  vipTime,
  playCorrectly,
  selectVariety,
  waitRightTime,
  getVideoHandler,
  isAdvert,
} from "../util";

describe("variety", () => {
  beforeEach(async () => {
    // 《脱口秀大会》第2期
    const url = "https://v.qq.com/x/cover/mzc00200zlzzlpl.html";
    page.setDefaultTimeout(60 * 1000);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  });

  // 去广告
  it("should remove the ad", async () => {
    // 合适的时间点
    await waitRightTime(page);
    // 获取视频handler
    let videoHandler = await getVideoHandler(page);
    // 判断是广告么
    const isAd = await isAdvert(videoHandler);
    expect(isAd).toBe(false);
  });

  // 播放vip视频
  it("should play the vip video correctly", async () => {
    // 正确播放
    await playCorrectly(page);
  });

  // 播放历史记录
  it("should play the vip video from history", async () => {
    // 正确播放
    await playCorrectly(page);
    // 缓一大会
    await page.waitFor(2000);
    // 重载页面
    await page.reload();
    // 合适的时间点
    await waitRightTime(page);
    const videoHandler = await getVideoHandler(page);
    // 判断历史记录是否生效
    const currentTime = await videoHandler.getProperty("currentTime");
    expect(await currentTime.jsonValue()).toBeGreaterThanOrEqual(vipTime);
  });

  // 选集面板正常工作
  it("should play the specified episode", async () => {
    // 正确播放
    await playCorrectly(page);
    // 选集
    await selectVariety(page);
    // 指定集数的正确播放
    await playCorrectly(page);
  });
});
