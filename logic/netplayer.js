(function initNetPlayer() {
  const C = window.NetPlayerConfig;
  const NF = window.NetPlayerNetflix;
  const icon = window.NetPlayerIcon;

  const prior = window.__netPlayerCleanup;
  if (prior) {
    prior();
    return;
  }

  NF.hideInterstitial();

  const video = document.querySelector("video");
  if (!video) {
    alert("Abre un video de Netflix primero.");
    return;
  }

  if (document.getElementById(C.panelId)) {
    alert("Recarga la página de Netflix antes de abrir la nueva versión.");
    return;
  }

  const host = video.parentElement || document.body;
  const savedPosition = host.style.position;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";

  const cleanup = [];
  let hideTimer = null;
  let destroyed = false;

  const on = (target, eventName, handler, options) => {
    target.addEventListener(eventName, handler, options || undefined);
    cleanup.push(() => target.removeEventListener(eventName, handler, options || undefined));
  };

  const createButton = (className, content, titleText, handler) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.innerHTML = content;
    button.title = titleText;
    button.setAttribute("aria-label", titleText);
    button.addEventListener("click", handler);
    return button;
  };

  const panel = document.createElement("div");
  panel.id = C.panelId;
  panel.className = "np-panel np-hidden";
  host.appendChild(panel);

  const backToTitle = createButton("np-return np-hidden", icon("return"), "Volver a la información del título", () => {
    const info = document.querySelector(".np-info");
    if (info) {
      info.hidden = false;
      info.classList.remove("np-hidden");
    }
  });
  host.appendChild(backToTitle);

  const info = document.createElement("div");
  info.className = "np-info";
  info.hidden = true;
  const infoContent = document.createElement("div");
  infoContent.className = "np-info-content";
  const infoKicker = document.createElement("div");
  infoKicker.className = "np-info-kicker";
  infoKicker.textContent = "Estás viendo";
  const infoHeading = document.createElement("div");
  infoHeading.className = "np-info-heading";
  const infoSeason = document.createElement("div");
  infoSeason.className = "np-info-season";
  const infoEpisode = document.createElement("div");
  infoEpisode.className = "np-info-episode";
  const infoDescription = document.createElement("p");
  infoDescription.className = "np-info-description";
  infoContent.append(infoKicker, infoHeading, infoSeason, infoEpisode, infoDescription);
  info.appendChild(infoContent);
  host.appendChild(info);

  function refreshInfo() {
    const meta = NF.getTitleInfo();
    infoHeading.textContent = meta.title || "Título";
    infoEpisode.textContent = meta.episode || "Episodio";
    infoDescription.textContent = meta.description || "";
    infoSeason.textContent = "";
    const visible = Boolean(meta.title || meta.episode || meta.description);
    info.hidden = !visible;
    if (!visible) info.classList.add("np-hidden");
    else info.classList.remove("np-hidden");
  }

  const progress = document.createElement("div");
  progress.className = "np-progress";
  const currentTime = document.createElement("span");
  currentTime.className = "np-time np-current";
  currentTime.textContent = "0:00";
  const preview = document.createElement("span");
  preview.className = "np-preview";
  const seekInput = document.createElement("input");
  seekInput.type = "range";
  seekInput.className = "np-seek";
  seekInput.min = "0";
  seekInput.max = "1000";
  seekInput.value = "0";
  seekInput.step = "1";
  seekInput.setAttribute("aria-label", "Posición de reproducción");
  const totalTime = document.createElement("span");
  totalTime.className = "np-time np-duration";
  totalTime.textContent = "0:00";
  const remaining = document.createElement("span");
  remaining.className = "np-time np-remaining";
  remaining.textContent = "";
  progress.append(currentTime, preview, seekInput, totalTime, remaining);

  const row = document.createElement("div");
  row.className = "np-row";
  panel.append(progress, row);

  const prevBtn = createButton("np-prev", icon("prev"), "Episodio anterior", () => NF.goToPrevEpisode());
  const backBtn = createButton("np-back", `${icon("back")}<span class="np-method">10s</span>`, "Retroceder 10 segundos", () => NF.keySim(video, "ArrowLeft", "ArrowLeft"));
  const playBtn = createButton("np-play", icon("play"), "Reproducir", () => {
    if (video.paused) video.play(); else video.pause();
    syncControls();
  });
  const forwardBtn = createButton("np-forward", `${icon("forward")}<span class="np-method">10s</span>`, "Adelantar 10 segundos", () => NF.keySim(video, "ArrowRight", "ArrowRight"));
  const nextBtn = createButton("np-next", icon("next"), "Episodio siguiente", () => NF.goToNextEpisode());

  const speedWrap = document.createElement("label");
  speedWrap.className = "np-speed-wrap";
  const speedHint = document.createElement("span");
  speedHint.className = "np-sr";
  speedHint.textContent = "Velocidad";
  const speedSelect = document.createElement("select");
  speedSelect.className = "np-speed";
  speedSelect.setAttribute("aria-label", "Velocidad de reproducción");
  C.speeds.forEach((rate) => {
    const option = document.createElement("option");
    option.value = String(rate);
    option.textContent = `${rate}×`;
    speedSelect.appendChild(option);
  });
  speedSelect.value = String(video.playbackRate || C.defaultPlaybackRate);
  speedWrap.append(speedHint, speedSelect);

  const muteBtn = createButton("np-mute", icon("volume"), "Silenciar", () => {
    const muted = video.muted || video.volume === 0;
    if (muted) {
      video.muted = false;
      video.volume = state.lastVolume || 0.5;
    } else {
      state.lastVolume = video.volume || 0.5;
      video.muted = true;
    }
    refreshMuteButton();
  });
  const volumeInput = document.createElement("input");
  volumeInput.type = "range";
  volumeInput.className = "np-volume";
  volumeInput.min = "0";
  volumeInput.max = "1";
  volumeInput.step = "0.01";
  volumeInput.value = String(video.volume || 0.5);

  const closeBtn = createButton("np-ab np-close", icon("close"), "Cerrar panel", () => destroy());
  const fullBtn = createButton("np-ab np-full", icon("fullscreen"), "Pantalla completa", () => {
    const wrapper = NF.getFullscreenWrapper(video);
    if (!document.fullscreenElement) wrapper.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
  const loopBtn = createButton("np-ab np-loop", icon("loop"), "Repetir", () => {
    video.loop = !video.loop;
    loopBtn.setAttribute("aria-pressed", String(video.loop));
  });
  const skipBtn = createButton("np-ab np-skip", icon("skip"), "Saltar intro", () => NF.keySim(video, "KeyS", "KeyS"));
  const pipBtn = createButton("np-ab np-pip", icon("pip"), "Picture-in-Picture", async () => {
    try {
      if (document.pictureInPictureElement !== video) await video.requestPictureInPicture();
      else await document.exitPictureInPicture();
    } catch (error) {
      console.warn("[NetPlayer] Picture-in-Picture failed:", error);
    }
  });

  row.append(prevBtn, backBtn, playBtn, forwardBtn, nextBtn, speedWrap, muteBtn, volumeInput, closeBtn, fullBtn, loopBtn, skipBtn, pipBtn);

  const sidePrev = createButton("np-side np-prev np-hidden", `${icon("prev")}<span class="np-method">ID</span>`, "Episodio anterior", () => NF.goToPrevEpisode());
  const sideNext = createButton("np-side np-next np-hidden", `${icon("next")}<span class="np-method">ID</span>`, "Episodio siguiente", () => NF.goToNextEpisode());
  sidePrev.hidden = true;
  sideNext.hidden = true;
  host.append(sidePrev, sideNext);

  const state = { lastVolume: Math.max(0, Math.min(1, video.volume || 0.5)), hideTimer: null };

  function refreshMuteButton() {
    const muted = video.muted || video.volume === 0;
    muteBtn.innerHTML = muted ? icon("mute") : icon("volume");
    muteBtn.setAttribute("aria-label", muted ? "Desilenciar" : "Silenciar");
  }

  function setPanelVisible(visible) {
    panel.classList.toggle("np-hidden", !visible);
    backToTitle.classList.toggle("np-hidden", !visible);
  }

  function startHideTimer() {
    clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(() => setPanelVisible(false), C.hideDelayMs);
  }

  function formatTime(value) {
    const safe = Math.max(0, Number.isFinite(value) ? value : 0);
    const totalSeconds = Math.floor(safe);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function updateSeek() {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      currentTime.textContent = "0:00";
      totalTime.textContent = "0:00";
      remaining.textContent = "";
      seekInput.value = "0";
      return;
    }

    const current = Number(video.currentTime || 0);
    const total = Number(video.duration || 0);
    seekInput.value = String((current / total) * 1000);
    currentTime.textContent = formatTime(current);
    totalTime.textContent = formatTime(total);
    remaining.textContent = `-${formatTime(Math.max(0, total - current))}`;
  }

  function syncControls() {
    playBtn.innerHTML = video.paused ? icon("play") : icon("pause");
    playBtn.setAttribute("aria-label", video.paused ? "Reproducir" : "Pausar");
    refreshMuteButton();
    if (Number.isFinite(video.duration)) totalTime.textContent = formatTime(video.duration);
    updateSeek();
  }

  on(video, "timeupdate", updateSeek);
  on(video, "loadedmetadata", updateSeek);
  on(video, "play", syncControls);
  on(video, "pause", syncControls);
  on(video, "volumechange", () => {
    volumeInput.value = String(video.volume || 0);
    refreshMuteButton();
  });
  on(seekInput, "input", () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const nextTime = (Number(seekInput.value) / 1000) * video.duration;
    video.currentTime = Math.min(Math.max(nextTime, 0), video.duration);
  });
  on(volumeInput, "input", () => {
    const value = Number(volumeInput.value);
    video.volume = value;
    video.muted = value === 0;
    state.lastVolume = value || 0.5;
    refreshMuteButton();
  });
  on(speedSelect, "change", () => {
    const rate = Number(speedSelect.value);
    if (Number.isFinite(rate)) video.playbackRate = rate;
  });

  on(host, "mouseenter", () => {
    setPanelVisible(true);
    startHideTimer();
  });
  on(host, "mousemove", () => {
    setPanelVisible(true);
    startHideTimer();
  });
  on(host, "mouseleave", () => {
    setPanelVisible(false);
    clearTimeout(state.hideTimer);
  });

  on(video, "click", () => {
    if (video.paused) video.play(); else video.pause();
    syncControls();
    setPanelVisible(true);
    startHideTimer();
  });

  on(document, "keydown", (event) => {
    if (event.target && ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
    if (event.code === "ArrowLeft") NF.keySim(video, "ArrowLeft", "ArrowLeft");
    if (event.code === "ArrowRight") NF.keySim(video, "ArrowRight", "ArrowRight");
    if (event.code === "Space") {
      event.preventDefault();
      if (video.paused) video.play(); else video.pause();
      syncControls();
    }
  });

  function updateEpisodeButtons() {
    const hasNav = NF.hasEpisodeNavigation();
    sidePrev.hidden = !hasNav;
    sideNext.hidden = !hasNav;
    sidePrev.classList.toggle("np-hidden", !hasNav);
    sideNext.classList.toggle("np-hidden", !hasNav);

    if (hasNav && video && host) {
      const hostRect = host.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();
      const top = videoRect.top - hostRect.top + videoRect.height / 2;
      const leftOffset = Math.max(12, videoRect.left - hostRect.left - 12);
      const rightOffset = Math.max(12, hostRect.width - (videoRect.right - hostRect.left) + 12);
      sidePrev.style.top = `${top}px`;
      sidePrev.style.left = `${leftOffset}px`;
      sideNext.style.top = `${top}px`;
      sideNext.style.right = `${rightOffset}px`;
    }
  }

  on(window, "resize", updateEpisodeButtons);
  on(window, "scroll", updateEpisodeButtons);
  updateEpisodeButtons();

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    clearTimeout(state.hideTimer);
    cleanup.forEach((fn) => fn());
    panel.remove();
    backToTitle.remove();
    info.remove();
    sidePrev.remove();
    sideNext.remove();
    if (host.style.position === "relative" && savedPosition === "") host.style.position = "";
    else if (savedPosition) host.style.position = savedPosition;
    window.__netPlayerCleanup = null;
  };

  window.__netPlayerCleanup = destroy;
  refreshInfo();
  refreshMuteButton();
  syncControls();
  setPanelVisible(true);
  startHideTimer();
})();
