(function initNetPlayer(){
  document.querySelector('.nf-modal.interstitial-full-screen').style.display = 'none';

  const video = document.querySelector("video");
  if (!video) { alert("No video found."); return; }
  if (document.getElementById("netf-controls-panel")) return;

  const container = video.parentElement || document.body;
  if (!container.style.position) container.style.position = "relative";
  if (!container.style.overflow) container.style.overflow = "hidden";

  const panel = document.createElement("div");
  panel.id = "netf-controls-panel";
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

  function keySim(code, key) {
    if (!video || video.tagName !== "VIDEO") return;
    ["keydown","keyup"].forEach(ev => video.dispatchEvent(new KeyboardEvent(ev, { key, code, keyCode: code === "KeyS" ? 83 : (code === "ArrowLeft" ? 37 : 39), which: code === "KeyS" ? 83 : (code === "ArrowLeft" ? 37 : 39), bubbles: true, cancelable: true })));
  }

  const back10 = makeBtn(NetPlayerIcons.back10, { title: "Back 10s", onClick: () => keySim("ArrowLeft","ArrowLeft") });
  const play = makeBtn(NetPlayerIcons.play, { title: "Play/Pause", onClick: () => { video.paused ? video.play() : video.pause(); sync(); } });
  const fwd10 = makeBtn(NetPlayerIcons.forward10, { title: "Forward 10s", onClick: () => keySim("ArrowRight","ArrowRight") });

  const speedWrap = document.createElement("div");
  speedWrap.style.position = "relative";
  speedWrap.style.display = "inline-flex";
  const speedBtn = makeBtn(`<span class="netf-speed">${video.playbackRate}×</span>`);
  const speedMenu = document.createElement("div");
  speedMenu.className = "netf-speed-menu";
  [0.5,1,1.25,1.5,2].forEach(s => {
    const b = document.createElement("button");
    b.className = "netf-btn";
    b.textContent = s + "×";
    b.disabled = true;
    b.onclick = () => { video.playbackRate = s; speedBtn.querySelector(".netf-speed").textContent = s + "×"; toggleSpeedMenu(false); };
    speedMenu.appendChild(b);
  });
  function toggleSpeedMenu(show) {
    if (show) {
      speedMenu.classList.add("show");
      [...speedMenu.querySelectorAll("button")].forEach(btn => btn.disabled = false);
    } else {
      speedMenu.classList.remove("show");
      [...speedMenu.querySelectorAll("button")].forEach(btn => btn.disabled = true);
    }
  }
  speedBtn.addEventListener("mouseenter", () => toggleSpeedMenu(true));
  speedWrap.addEventListener("mouseleave", () => toggleSpeedMenu(false));
  speedBtn.addEventListener("click", e => { e.stopPropagation(); toggleSpeedMenu(!speedMenu.classList.contains("show")); });
  document.addEventListener("click", e => { if (!speedWrap.contains(e.target)) toggleSpeedMenu(false); });
  speedWrap.appendChild(speedBtn);
  speedWrap.appendChild(speedMenu);

  let lastVolume = video.volume;
  const volWrap = document.createElement("div");
  volWrap.className = "netf-vol";
  const volIcon = document.createElement("button");
  volIcon.className = "netf-btn";
  volIcon.innerHTML = NetPlayerIcons.volume;
  volIcon.title = "Mute/Unmute";
  const volSlider = document.createElement("input");
  volSlider.type = "range";
  volSlider.min = 0; volSlider.max = 1; volSlider.step = 0.01; volSlider.value = video.volume;
  volSlider.style.zIndex = "2147483660";
  volSlider.oninput = () => {
    video.volume = parseFloat(volSlider.value);
    video.muted = false;
    volIcon.innerHTML = video.volume > 0 ? NetPlayerIcons.volume : NetPlayerIcons.volumeMuted;
    lastVolume = video.volume;
  };
  let volTimer;
  const showVolume = () => {
    clearTimeout(volTimer);
    volWrap.classList.add("show");
    volSlider.style.opacity = "1";
    volSlider.style.pointerEvents = "auto";
    volTimer = setTimeout(() => {
      volWrap.classList.remove("show");
      volSlider.style.opacity = "0";
      volSlider.style.pointerEvents = "none";
    }, 1500);
  };
  volIcon.onclick = () => {
    if (video.muted || video.volume === 0) {
      video.muted = false;
      video.volume = lastVolume || 0.5;
      volIcon.innerHTML = NetPlayerIcons.volume;
    } else {
      video.muted = true;
      volIcon.innerHTML = NetPlayerIcons.volumeMuted;
    }
    showVolume();
  };
  volWrap.append(volIcon, volSlider);
  volWrap.addEventListener("mouseenter", () => { clearTimeout(volTimer); volWrap.classList.add("show"); volSlider.style.opacity = "1"; volSlider.style.pointerEvents = "auto"; });
  volWrap.addEventListener("mouseleave", () => { volTimer = setTimeout(() => { volWrap.classList.remove("show"); volSlider.style.opacity = "0"; volSlider.style.pointerEvents = "none"; }, 800); });
  video.addEventListener("volumechange", () => { 
    if (!video.muted) { 
      volSlider.value = video.volume; 
      lastVolume = video.volume; 
      volIcon.innerHTML = video.volume > 0 ? NetPlayerIcons.volume : NetPlayerIcons.volumeMuted;
    } 
  });

  const fs = makeBtn(NetPlayerIcons.fullscreen, { title: "Fullscreen", onClick: () => {
    const wrapper = video.closest('div[class*="VideoContainer"],div[class*="watch-video-wrapper"],div[class*="player-container"]') || video.parentElement;
    if (!document.fullscreenElement) { wrapper.requestFullscreen?.(); } else { document.exitFullscreen?.(); }
  }});
  const skip = makeBtn(NetPlayerIcons.skip, { title: "Skip Intro (S)", onClick: () => keySim("KeyS","KeyS") });
  const close = makeBtn(NetPlayerIcons.close, { title: "Close Panel", onClick: () => { try { panel.remove(); if (prevBtn) prevBtn.remove(); if (nextBtn) nextBtn.remove(); if (progress) progress.remove(); if (centerIndicator) centerIndicator.remove(); } catch(e){} } });
  const loopBtn = makeBtn(NetPlayerIcons.loop, { title: "Loop", onClick: () => { video.loop = !video.loop; loopBtn.classList.toggle("primary", video.loop); } });
  const pipBtn = makeBtn(NetPlayerIcons.pip, { title: "PIP", onClick: async () => { try { if (video !== document.pictureInPictureElement) { await video.requestPictureInPicture(); } else { await document.exitPictureInPicture(); } } catch(e){} } });

  leftSec.append(back10, play, fwd10, speedWrap, volWrap);
  centerSec.append(loopBtn, pipBtn, skip);
  rightSec.append(fs, close);
  panel.append(leftSec, centerSec, rightSec);

  function getVideoNumber(){ const m = window.location.pathname.match(/\/watch\/(\d+)/); return m ? parseInt(m[1]) : null; }
  function goToVideo(n){ if (n !== null && n > 0) window.location.pathname = "/watch/" + n; }

  const prevBtn = document.createElement("button");
  prevBtn.className = "netf-nav-btn";
  prevBtn.innerHTML = NetPlayerIcons.prev;
  prevBtn.title = "Previous";
  prevBtn.onclick = () => goToVideo(getVideoNumber() - 1);
  const nextBtn = document.createElement("button");
  nextBtn.className = "netf-nav-btn";
  nextBtn.innerHTML = NetPlayerIcons.next;
  nextBtn.title = "Next";
  nextBtn.onclick = () => goToVideo(getVideoNumber() + 1);
  container.appendChild(prevBtn);
  container.appendChild(nextBtn);

  function showControls(){ panel.style.opacity = "1"; prevBtn.style.opacity = "1"; nextBtn.style.opacity = "1"; }
  function hideControls(){ panel.style.opacity = "0"; prevBtn.style.opacity = "0"; nextBtn.style.opacity = "0"; }
  let hideTimer;
  const startHideTimer = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hideControls, 2500); };
  container.addEventListener("mouseenter", () => { showControls(); startHideTimer(); });
  container.addEventListener("mousemove", () => { showControls(); startHideTimer(); });
  container.addEventListener("mouseleave", () => { hideControls(); clearTimeout(hideTimer); });

  const progress = document.createElement("div");
  progress.className = "netf-progress";
  const progressBar = document.createElement("div");
  progressBar.className = "netf-progress-bar";
  progress.appendChild(progressBar);
  container.appendChild(progress);

  const centerIndicator = document.createElement("div");
  centerIndicator.className = "netf-center-indicator";
  centerIndicator.innerHTML = NetPlayerIcons.pause;
  container.appendChild(centerIndicator);
  function updateProgress(){ progressBar.style.width = ((video.currentTime / video.duration) * 100 || 0) + "%"; }
  video.addEventListener("timeupdate", updateProgress);

  let dragging = false;
  function seekNetflix(pct){
    const d = video.duration;
    if (!d || !isFinite(d)) return;
    const target = pct * d;
    const diff = target - video.currentTime;
    const step = 10;
    const times = Math.round(Math.abs(diff) / step);
    const key = diff > 0 ? "ArrowRight" : "ArrowLeft";
    const maxTimes = Math.min(times, 60);
    for (let i = 0; i < maxTimes; i++) keySim(key, key);
  }
  function seekNetflixByMouse(e){
    const rect = progress.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));
    seekNetflix(pct);
  }
  progress.addEventListener("mousedown", e => { dragging = true; seekNetflixByMouse(e); });
  document.addEventListener("mousemove", e => { if (dragging) seekNetflixByMouse(e); });
  document.addEventListener("mouseup", () => { dragging = false; });

  function updateNavButtons(){
    const cRect = container.getBoundingClientRect();
    const vRect = video.getBoundingClientRect();
    const relTop = vRect.top - cRect.top;
    const relLeft = vRect.left - cRect.left;
    prevBtn.style.top = (relTop + vRect.height / 2) + "px";
    prevBtn.style.left = (relLeft + 8) + "px";
    prevBtn.style.transform = "translateY(-50%)";
    nextBtn.style.top = (relTop + vRect.height / 2) + "px";
    const nextLeft = relLeft + vRect.width - (nextBtn.offsetWidth + 8);
    nextBtn.style.left = nextLeft + "px";
    nextBtn.style.transform = "translateY(-50%)";
    prevBtn.style.zIndex = nextBtn.style.zIndex = "2147483650";
  }
  updateNavButtons();
  window.addEventListener("resize", updateNavButtons);
  new MutationObserver(updateNavButtons).observe(video, { attributes: true, attributeFilter: ['style','class'] });
  window.addEventListener("scroll", updateNavButtons);

  function sync(){ 
    play.innerHTML = video.paused ? NetPlayerIcons.play : NetPlayerIcons.pause; 
    centerIndicator.innerHTML = video.paused ? NetPlayerIcons.play : NetPlayerIcons.pause;
  }
  
  function showCenterIndicator() {
    centerIndicator.classList.add("show");
    setTimeout(() => centerIndicator.classList.remove("show"), 1000);
  }
  
  video.addEventListener("play", () => { sync(); showCenterIndicator(); });
  video.addEventListener("pause", () => { sync(); showCenterIndicator(); });
  sync();
  updateProgress();

  video.addEventListener("click", () => { 
    if (video.paused) { 
      video.play(); 
    } else { 
      video.pause(); 
    } 
    sync(); 
    showCenterIndicator();
  });
})();
