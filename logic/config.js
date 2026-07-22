(function () {
  window.NetPlayerConfig = {
    panelId: "netf-controls-panel",
    speeds: [0.5, 1, 1.25, 1.5, 2],
    hideDelayMs: 2500,
    volumeHideDelayMs: 1500,
    volumeLeaveDelayMs: 800,
    centerIndicatorMs: 1000,
    seekStepSec: 10,
    maxSeekSteps: 60,
    watchUrlPattern: /\/watch\/(\d+)/,
    interstitialSelector: ".nf-modal.interstitial-full-screen",
    fullscreenSelectors: [
      'div[class*="VideoContainer"]',
      'div[class*="watch-video-wrapper"]',
      'div[class*="player-container"]',
    ],
    nextEpisodeSelectors: [
      'button[data-uia="next-episode-seamless-button"]',
      'button[data-uia="control-next"]',
      'button[aria-label*="Next episode"]',
      'button[aria-label*="Siguiente episodio"]',
    ],
    prevEpisodeSelectors: [
      'button[data-uia="control-back"]',
      'button[aria-label*="Previous episode"]',
      'button[aria-label*="Episodio anterior"]',
    ],
  };
})();
