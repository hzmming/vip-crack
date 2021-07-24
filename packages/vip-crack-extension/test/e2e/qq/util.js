import { API } from "../../../src/constants";

// 播放vip时间。一般只能播放前5分钟 (5*60)
const vipTime = 10 * 60;

async function playCorrectly(page) {
  // 合适的时间点
  await waitRightTime(page);
  // 获取视频handler
  let videoHandler = await getVideoHandler(page);
  await playTime(videoHandler, vipTime);
  // 缓一大会
  await page.waitFor(2000);
  // 判断播放状态
  const status = await videoHandler.getProperty("paused");
  expect(await status.jsonValue()).toBe(false);
}

/**
 * @param {*} page
 * @param {集数} epIndex
 */
async function selectVariety(page, epIndex) {
  await selectEpisode(page, {
    epIndex,
    panelClass: '#video_scroll_wrap [data-tpl="variety"]',
  });
}

/**
 * @param {*} page
 * @param {集数} epIndex
 */
async function selectAnime(page, epIndex) {
  await selectEpisode(page, {
    epIndex,
    panelClass: '#video_scroll_wrap [data-tpl="episode-un"]',
  });
}

/**
 * @param {*} page
 * @param {集数：一般是多语言版本才有} epIndex
 */
async function selectMovie(page, epIndex) {
  await selectEpisode(page, {
    epIndex,
    panelClass: "#_pic_title_list_ul",
  });
}

/**
 * epIndex不存在时，随机播放另一集
 * @param {*} page
 * @param {集数} epIndex
 */
async function selectEpisode(page, { epIndex, panelClass }) {
  // 获取选集面板
  const episodePanel = await page.$(panelClass);
  // 播放下一集
  const epUrl = await page.evaluate(
    (panel, episode) => {
      return selectEp(episode);

      function selectEp(ep) {
        let target = null;
        if (typeof ep === "number") {
          target = panel.children[ep];
        } else {
          target = [...panel.children].find(
            i => !i.classList.contains("current")
          );
        }
        if (!target) return null;
        const linkBtn = target.querySelector("a");
        const url = linkBtn.href;
        linkBtn.click();
        return url;
      }
    },
    episodePanel,
    epIndex
  );
  // 电影只有多语言版本才有其它集可选
  if (epUrl) {
    // 浏览器url发生变化（不包括hash和query），即被视为navigation
    await page.waitForNavigation();
    expect(page.url()).toBe(epUrl);
  }
}

/**
 * 合适的时间点。这个判断非常主观
 */
async function waitRightTime(page) {
  // 腾讯视频默认自动播放
  await waitPlayingVideo(page);
}

/**
 * 等待播放中的视频
 * @param {*} page
 */
async function waitPlayingVideo(page) {
  page.on("console", msg => {
    const isApiError = msg.text().includes(API.ERROR);
    if (isApiError) throw new Error("api接口解析失败");
  });
  await page.waitForFunction(() => {
    return [...document.querySelectorAll("*")].find(
      i => i.duration > 0 && !i.paused
    );
  });
}

async function getVideoHandler(page) {
  return await page.evaluateHandle(() => {
    return [...document.querySelectorAll("*")].find(
      i => i.duration > 0 && !i.paused
    );
  });
}

async function isAdvert(videoHandler) {
  return await videoHandler.evaluate(videoDom => {
    const adContainerFlag = "adplayer-video-ad-container";
    return videoDom.parentElement.dataset.role === adContainerFlag;
  });
}

async function playTime(videoHandler, time) {
  await videoHandler.evaluate((videoDom, t) => {
    videoDom.currentTime = t;
  }, time);
}

export {
  vipTime,
  playCorrectly,
  selectVariety,
  selectAnime,
  selectEpisode,
  selectMovie,
  waitRightTime,
  getVideoHandler,
  isAdvert,
  playTime,
};
