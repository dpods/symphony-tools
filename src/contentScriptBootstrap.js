// chrome extensions are a bit of a pain to work with, so we have to do some silly things to get native es6 imports to work
(async () => {
  const src = chrome.runtime.getURL("init.js");
  const contentScript = await import(src);
  contentScript.main(/* chrome: no need to pass it */);
})();
