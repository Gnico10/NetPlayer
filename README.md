## NetPlayer Bookmarklet

### Create the bookmarklet

Create a new browser bookmark and paste this as the URL (replace with your hosted `loader.js`):

```javascript
javascript:(function () {let code = document.createElement('script');code.src = 'https://example.com/netplayer/logic/loader.js';document.body.appendChild(code);}())
```

This matches the exact pattern you provided and references a single file that loads everything else.

### How it works

- The bookmarklet injects `logic/loader.js`.
- The loader injects `styles/netplayer.css`, then `logic/netplayer.js`.
- The UI appears over the current page's `<video>` element.

### Notes

- The loader computes its base path from `document.currentScript.src`; keep the folder structure as-is.
- No build step is required; files are used as-is.
