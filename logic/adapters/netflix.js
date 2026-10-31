(function () {
  const C = window.NetPlayerConfig;

  function hideInterstitial() {
    const interstitial = document.querySelector(C.interstitialSelector);
    if (interstitial) interstitial.style.setProperty("display", "none");
  }

  function keySim(video, code, key) {
    if (!video || video.tagName !== "VIDEO") return false;

    const keyCode = code === "KeyS" ? 83 : code === "ArrowLeft" ? 37 : code === "ArrowRight" ? 39 : 0;
    ["keydown", "keyup"].forEach((ev) => {
      video.dispatchEvent(
        new KeyboardEvent(ev, {
          key,
          code,
          keyCode,
          which: keyCode,
          bubbles: true,
          cancelable: true,
        })
      );
    });
    return true;
  }

  function findNativeButton(selectors) {
    for (const selector of selectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled && btn.offsetParent !== null) return btn;
    }
    return null;
  }

  function getVideoNumber() {
    const match = window.location.pathname.match(C.watchUrlPattern);
    return match ? parseInt(match[1], 10) : null;
  }

  function goToVideo(n) {
    if (n !== null && n > 0) {
      window.location.pathname = "/watch/" + n;
      return true;
    }
    return false;
  }

  function hasEpisodeNavigation() {
    return getVideoNumber() !== null || !!findNativeButton(C.nextEpisodeSelectors);
  }

  function goToNextEpisode() {
    const native = findNativeButton(C.nextEpisodeSelectors);
    if (native) {
      native.click();
      return true;
    }

    const current = getVideoNumber();
    if (current !== null) {
      return goToVideo(current + 1);
    }
    return false;
  }

  function goToPrevEpisode() {
    const native = findNativeButton(C.prevEpisodeSelectors);
    if (native) {
      native.click();
      return true;
    }

    const current = getVideoNumber();
    if (current !== null && current > 1) {
      return goToVideo(current - 1);
    }
    return false;
  }

  function getFullscreenWrapper(videoEl) {
    for (const selector of C.fullscreenSelectors) {
      const el = videoEl.closest(selector);
      if (el) return el;
    }
    return videoEl.parentElement || document.body;
  }

  function seek(videoEl, pct) {
    const duration = Number(videoEl.duration || 0);
    if (!duration || !Number.isFinite(duration)) return;

    const target = Math.max(0, Math.min(1, pct)) * duration;
    const diff = target - videoEl.currentTime;
    const times = Math.round(Math.abs(diff) / C.seekStepSec);
    const code = diff >= 0 ? "ArrowRight" : "ArrowLeft";
    const maxTimes = Math.min(times, C.maxSeekSteps);

    for (let i = 0; i < maxTimes; i += 1) keySim(videoEl, code, code);
  }

  function getTitleInfo() {
    const fallbackTitle = document.title.replace(/\s*[-–].*$/, "").trim();
    const episode = document.querySelector('[data-uia="video-title"]')?.textContent || document.querySelector('h1')?.textContent || fallbackTitle;
    return {
      title: fallbackTitle,
      episode,
      description: document.querySelector('[data-uia="video-description"]')?.textContent || document.querySelector('[data-ui="summary"]')?.textContent || "",
    };
  }

  window.NetPlayerNetflix = {
    hideInterstitial,
    keySim,
    findNativeButton,
    getVideoNumber,
    goToVideo,
    hasEpisodeNavigation,
    goToNextEpisode,
    goToPrevEpisode,
    getFullscreenWrapper,
    seek,
    getTitleInfo,
  };
})();
