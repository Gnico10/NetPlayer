import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const css = readFileSync(join(root, "styles/netplayer.css"), "utf8");

const jsFiles = [
  "logic/config.js",
  "logic/icons.js",
  "logic/adapters/netflix.js",
  "logic/netplayer.js",
];

const inlineJs = jsFiles
  .map((file) => readFileSync(join(root, file), "utf8"))
  .join("\n");

function escapeForSingleQuotedJs(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const bootstrap = `(function(){
  var style = document.createElement("style");
  style.textContent = '${escapeForSingleQuotedJs(css)}';
  document.head.appendChild(style);
  var script = document.createElement("script");
  script.textContent = '${escapeForSingleQuotedJs(inlineJs)}';
  document.body.appendChild(script);
})();`;

const bookmarklet = "javascript:" + encodeURIComponent(bootstrap);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/bookmarklet.txt"), bookmarklet, "utf8");
writeFileSync(join(root, "dist/bookmarklet.js"), bootstrap, "utf8");

console.log("Bookmarklet generado en dist/bookmarklet.txt");
console.log("Longitud:", bookmarklet.length, "caracteres");
