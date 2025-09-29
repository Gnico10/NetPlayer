(function(){
  const loaderSrc = (document.currentScript && document.currentScript.src) || location.href;
  const projectRoot = new URL('..', loaderSrc); // parent of /logic/

  const cssHref = new URL('styles/netplayer.css', projectRoot).toString();
  const iconsSrc = new URL('logic/icons.js', projectRoot).toString();
  const jsSrc = new URL('logic/netplayer.js', projectRoot).toString();

  function loadCSS(href){
    return new Promise((resolve, reject)=>{
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  function loadJS(src){
    return new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  loadCSS(cssHref).catch(()=>{}).then(()=>{
    return loadJS(iconsSrc);
  }).then(()=>{
    return loadJS(jsSrc);
  }).catch(()=>{});
})();
