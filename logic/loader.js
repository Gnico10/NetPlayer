/**
 * Legacy remote loader for sites without strict CSP (not Netflix).
 * For Netflix and similar platforms, use the inline bookmarklet from dist/bookmarklet.txt.
 */
(function () {
  const warn = (msg, err) => console.warn("[NetPlayer]", msg, err || "");

  const currentScript = document.currentScript;
  const loaderSrc = (currentScript && currentScript.src) || "";

  if (!loaderSrc) {
    warn("loader.js requires an external src URL. Use scripts/build-bookmarklet.mjs for inline injection.");
    return;
  }

  const projectRoot = new URL("..", loaderSrc);
  const cssHref = new URL("styles/netplayer.css", projectRoot).toString();
  const jsFiles = [
    "logic/config.js",
    "logic/icons.js",
    "logic/adapters/netflix.js",
    "logic/netplayer.js",
  ].map((path) => new URL(path, projectRoot).toString());

  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.onload = resolve;
      link.onerror = () => reject(new Error("Failed to load CSS: " + href));
      document.head.appendChild(link);
    });
  }

  function loadJS(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load script: " + src));
      document.body.appendChild(script);
    });
  }

  loadCSS(cssHref)
    .catch((err) => warn(err.message, err))
    .then(() => jsFiles.reduce((chain, src) => chain.then(() => loadJS(src)), Promise.resolve()))
    .catch((err) => warn(err.message, err));
})();
