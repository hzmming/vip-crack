import "expect-puppeteer";
import {
  vipTime,
  playCorrectly,
  selectAnime,
  waitRightTime,
  getVideoHandler,
  isAdvert,
  playTime,
} from "../util";

/**
 * 验证vip视频是否正确解析
 */
describe("anime", () => {
  beforeEach(async () => {
    // 《命运石之门》第2集
    const secondEpUrl =
      "https://v.qq.com/x/cover/gvz5bapszkkjbw8/b0026nzjshz.html";
    page.setDefaultTimeout(60 * 1000);
    await page.goto(secondEpUrl, {
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
    const thirdEP = 2; // 当前测试为第2集，直接写死第3集，省点事
    await selectAnime(page, thirdEP);
    // 指定集数的正确播放
    await playCorrectly(page);
  });

  // 视频结束后自动连播
  it("should auto play the next episode", async () => {
    // 正确播放
    await playCorrectly(page);
    const videoHandler = await getVideoHandler(page);
    const duration = await videoHandler.getProperty("duration");
    // 跳到最后一秒
    await playTime(videoHandler, Math.floor(await duration.jsonValue()));
    // 获取旧url
    const oldUrl = page.url();
    // 浏览器url发生变化（不包括hash和query），即被视为navigation
    await page.waitForNavigation();
    // 获取新url
    const newUrl = page.url();
    // 简单地判断：新的url和旧的url不一样，即成功
    expect(oldUrl).not.toBe(newUrl);
  });
});
