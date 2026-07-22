(function () {
  const C = window.NetPlayerConfig;

  function hideInterstitial() {
    document.querySelector(C.interstitialSelector)?.style.setProperty("display", "none");
  }

  function keySim(video, code, key) {
    if (!video || video.tagName !== "VIDEO") return;
    const keyCode =
      code === "KeyS" ? 83 : code === "ArrowLeft" ? 37 : code === "ArrowRight" ? 39 : 0;
    ["keydown", "keyup"].forEach((ev) =>
      video.dispatchEvent(
        new KeyboardEvent(ev, {
          key,
          code,
          keyCode,
          which: keyCode,
          bubbles: true,
          cancelable: true,
        })
      )
    );
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
    if (n !== null && n > 0) window.location.pathname = "/watch/" + n;
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
      goToVideo(current + 1);
      return true;
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
      goToVideo(current - 1);
      return true;
    }
    return false;
  }

  function getFullscreenWrapper(video) {
    for (const selector of C.fullscreenSelectors) {
      const el = video.closest(selector);
      if (el) return el;
    }
    return video.parentElement;
  }

  function seek(video, pct) {
    const duration = video.duration;
    if (!duration || !isFinite(duration)) return;

    const target = pct * duration;
    const diff = target - video.currentTime;
    const times = Math.round(Math.abs(diff) / C.seekStepSec);
    const code = diff > 0 ? "ArrowRight" : "ArrowLeft";
    const maxTimes = Math.min(times, C.maxSeekSteps);

    for (let i = 0; i < maxTimes; i++) keySim(video, code, code);
  }

  window.NetPlayerNetflix = {
    hideInterstitial,
    keySim,
    getVideoNumber,
    goToVideo,
    hasEpisodeNavigation,
    goToNextEpisode,
    goToPrevEpisode,
    getFullscreenWrapper,
    seek,
  };
})();
