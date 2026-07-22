(function initNetPlayer() {
  const C = window.NetPlayerConfig;
  const NF = window.NetPlayerNetflix;
  const icon = window.NetPlayerIcon;

  NF.hideInterstitial();

  const video = document.querySelector("video");
  if (!video) {
    alert("No video found.");
    return;
  }
  if (document.getElementById(C.panelId)) return;

  const container = video.parentElement || document.body;
  if (!container.style.position) container.style.position = "relative";
  if (!container.style.overflow) container.style.overflow = "hidden";

  const cleanup = [];
  let hideTimer;
  let volTimer;
  let centerTimer;
  let dragging = false;
  let destroyed = false;

  function on(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    cleanup.push(() => target.removeEventListener(event, handler, options));
  }

  function clearHideTimer() {
    clearTimeout(hideTimer);
  }

  function clearVolTimer() {
    clearTimeout(volTimer);
  }

  function clearCenterTimer() {
    clearTimeout(centerTimer);
  }

  const panel = document.createElement("div");
  panel.id = C.panelId;
  container.appendChild(panel);

  const leftSec = document.createElement("div");
  leftSec.className = "netf-section left";
  const centerSec = document.createElement("div");
  centerSec.className = "netf-section center";
  const rightSec = document.createElement("div");
  rightSec.className = "netf-section right";

  const makeBtn = (label, opts = {}) => {
    const b = document.createElement("button");
    b.className = "netf-btn" + (opts.p ? " primary" : "");
    b.title = opts.title || label;
    b.innerHTML = opts.html || label;
    b.onclick = opts.onClick || (() => {});
    return b;
  };

  const back10 = makeBtn(icon("back10"), {
    title: "Back 10s",
    onClick: () => NF.keySim(video, "ArrowLeft", "ArrowLeft"),
  });
  const play = makeBtn(icon("play"), {
    title: "Play/Pause",
    onClick: () => {
      video.paused ? video.play() : video.pause();
      sync();
    },
  });
  const fwd10 = makeBtn(icon("forward10"), {
    title: "Forward 10s",
    onClick: () => NF.keySim(video, "ArrowRight", "ArrowRight"),
  });

  const speedWrap = document.createElement("div");
  speedWrap.className = "netf-speed-wrap";
  const speedBtn = makeBtn(`<span class="netf-speed">${video.playbackRate}×</span>`);
  const speedMenu = document.createElement("div");
  speedMenu.className = "netf-speed-menu";
  C.speeds.forEach((s) => {
    const b = document.createElement("button");
    b.className = "netf-btn";
    b.textContent = s + "×";
    b.onclick = () => {
      video.playbackRate = s;
      speedBtn.querySelector(".netf-speed").textContent = s + "×";
      toggleSpeedMenu(false);
    };
    speedMenu.appendChild(b);
  });

  function toggleSpeedMenu(show) {
    speedMenu.classList.toggle("show", show);
    speedMenu.setAttribute("aria-hidden", show ? "false" : "true");
  }

  on(speedBtn, "mouseenter", () => toggleSpeedMenu(true));
  on(speedWrap, "mouseleave", () => toggleSpeedMenu(false));
  on(speedBtn, "click", (e) => {
    e.stopPropagation();
    toggleSpeedMenu(!speedMenu.classList.contains("show"));
  });
  on(document, "click", (e) => {
    if (!speedWrap.contains(e.target)) toggleSpeedMenu(false);
  });
  speedWrap.appendChild(speedBtn);
  speedWrap.appendChild(speedMenu);
  toggleSpeedMenu(false);

  let lastVolume = video.volume;
  const volWrap = document.createElement("div");
  volWrap.className = "netf-vol";
  const volIcon = makeBtn(icon("volume"), {
    title: "Mute/Unmute",
    onClick: () => {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        video.volume = lastVolume || 0.5;
        volIcon.innerHTML = icon("volume");
      } else {
        video.muted = true;
        volIcon.innerHTML = icon("volumeMuted");
      }
      showVolume();
    },
  });
  const volSlider = document.createElement("input");
  volSlider.type = "range";
  volSlider.min = 0;
  volSlider.max = 1;
  volSlider.step = 0.01;
  volSlider.value = video.volume;

  function setVolumeVisible(visible) {
    volWrap.classList.toggle("show", visible);
  }

  function showVolume() {
    clearVolTimer();
    setVolumeVisible(true);
    volTimer = setTimeout(() => setVolumeVisible(false), C.volumeHideDelayMs);
  }

  on(volSlider, "input", () => {
    video.volume = parseFloat(volSlider.value);
    video.muted = false;
    volIcon.innerHTML = video.volume > 0 ? icon("volume") : icon("volumeMuted");
    lastVolume = video.volume;
  });
  on(volWrap, "mouseenter", () => {
    clearVolTimer();
    setVolumeVisible(true);
  });
  on(volWrap, "mouseleave", () => {
    volTimer = setTimeout(() => setVolumeVisible(false), C.volumeLeaveDelayMs);
  });
  on(video, "volumechange", () => {
    if (!video.muted) {
      volSlider.value = video.volume;
      lastVolume = video.volume;
      volIcon.innerHTML = video.volume > 0 ? icon("volume") : icon("volumeMuted");
    }
  });

  volWrap.append(volIcon, volSlider);

  const fs = makeBtn(icon("fullscreen"), {
    title: "Fullscreen",
    onClick: () => {
      const wrapper = NF.getFullscreenWrapper(video);
      if (!document.fullscreenElement) wrapper.requestFullscreen?.();
      else document.exitFullscreen?.();
    },
  });
  const skip = makeBtn(icon("skip"), {
    title: "Skip Intro (S)",
    onClick: () => NF.keySim(video, "KeyS", "KeyS"),
  });
  const loopBtn = makeBtn(icon("loop"), {
    title: "Loop",
    onClick: () => {
      video.loop = !video.loop;
      loopBtn.classList.toggle("primary", video.loop);
    },
  });
  const pipBtn = makeBtn(icon("pip"), {
    title: "PIP",
    onClick: async () => {
      try {
        if (video !== document.pictureInPictureElement) await video.requestPictureInPicture();
        else await document.exitPictureInPicture();
      } catch (e) {
        console.warn("[NetPlayer] Picture-in-Picture failed:", e);
      }
    },
  });

  leftSec.append(back10, play, fwd10, speedWrap, volWrap);
  centerSec.append(loopBtn, pipBtn, skip);
  rightSec.append(fs);
  panel.append(leftSec, centerSec, rightSec);

  const showEpisodeNav = NF.hasEpisodeNavigation();
  let prevBtn = null;
  let nextBtn = null;

  if (showEpisodeNav) {
    prevBtn = document.createElement("button");
    prevBtn.className = "netf-nav-btn";
    prevBtn.innerHTML = icon("prev");
    prevBtn.title = "Previous";
    prevBtn.onclick = () => NF.goToPrevEpisode();

    nextBtn = document.createElement("button");
    nextBtn.className = "netf-nav-btn";
    nextBtn.innerHTML = icon("next");
    nextBtn.title = "Next";
    nextBtn.onclick = () => NF.goToNextEpisode();

    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
  }

  const progress = document.createElement("div");
  progress.className = "netf-progress";
  const progressBar = document.createElement("div");
  progressBar.className = "netf-progress-bar";
  progress.appendChild(progressBar);
  container.appendChild(progress);

  const centerIndicator = document.createElement("div");
  centerIndicator.className = "netf-center-indicator";
  centerIndicator.innerHTML = icon("pause");
  container.appendChild(centerIndicator);

  function showControls() {
    panel.style.opacity = "1";
    if (prevBtn) prevBtn.style.opacity = "1";
    if (nextBtn) nextBtn.style.opacity = "1";
  }

  function hideControls() {
    panel.style.opacity = "0";
    if (prevBtn) prevBtn.style.opacity = "0";
    if (nextBtn) nextBtn.style.opacity = "0";
  }

  function startHideTimer() {
    clearHideTimer();
    hideTimer = setTimeout(hideControls, C.hideDelayMs);
  }

  on(container, "mouseenter", () => {
    showControls();
    startHideTimer();
  });
  on(container, "mousemove", () => {
    showControls();
    startHideTimer();
  });
  on(container, "mouseleave", () => {
    hideControls();
    clearHideTimer();
  });

  function updateProgress() {
    progressBar.style.width = ((video.currentTime / video.duration) * 100 || 0) + "%";
  }

  on(video, "timeupdate", updateProgress);

  function seekByMouse(e) {
    const rect = progress.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    NF.seek(video, pct);
  }

  on(progress, "mousedown", (e) => {
    dragging = true;
    seekByMouse(e);
  });
  on(document, "mousemove", (e) => {
    if (dragging) seekByMouse(e);
  });
  on(document, "mouseup", () => {
    dragging = false;
  });

  function updateNavButtons() {
    if (!prevBtn || !nextBtn) return;
    const cRect = container.getBoundingClientRect();
    const vRect = video.getBoundingClientRect();
    const relTop = vRect.top - cRect.top;
    const relLeft = vRect.left - cRect.left;
    prevBtn.style.top = relTop + vRect.height / 2 + "px";
    prevBtn.style.left = relLeft + 8 + "px";
    prevBtn.style.transform = "translateY(-50%)";
    nextBtn.style.top = relTop + vRect.height / 2 + "px";
    nextBtn.style.left = relLeft + vRect.width - (nextBtn.offsetWidth + 8) + "px";
    nextBtn.style.transform = "translateY(-50%)";
  }

  if (showEpisodeNav) {
    updateNavButtons();
    on(window, "resize", updateNavButtons);
    on(window, "scroll", updateNavButtons);
    const observer = new MutationObserver(updateNavButtons);
    observer.observe(video, { attributes: true, attributeFilter: ["style", "class"] });
    cleanup.push(() => observer.disconnect());
  }

  function sync() {
    play.innerHTML = video.paused ? icon("play") : icon("pause");
    centerIndicator.innerHTML = video.paused ? icon("play") : icon("pause");
  }

  function showCenterIndicator() {
    centerIndicator.classList.add("show");
    clearCenterTimer();
    centerTimer = setTimeout(() => centerIndicator.classList.remove("show"), C.centerIndicatorMs);
  }

  on(video, "play", () => {
    sync();
    showCenterIndicator();
  });
  on(video, "pause", () => {
    sync();
    showCenterIndicator();
  });
  on(video, "click", () => {
    video.paused ? video.play() : video.pause();
    sync();
    showCenterIndicator();
  });

  sync();
  updateProgress();
  showControls();
  startHideTimer();

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    clearHideTimer();
    clearVolTimer();
    clearCenterTimer();
    cleanup.forEach((fn) => fn());

    panel.remove();
    progress.remove();
    centerIndicator.remove();
    prevBtn?.remove();
    nextBtn?.remove();
  }

  const close = makeBtn(icon("close"), { title: "Close Panel", onClick: destroy });
  rightSec.append(close);
})();
