// Spaghetti LAB "deep" theme companion script.
//
// Intentionally does nothing but tag <body> and do a one-time fade-in.
// It does not call any Node-RED internal API (RED.*), so it has nothing to
// break if the editor's internals change between versions — only custom.css
// (which targets internal class names) needs re-checking after an upgrade.
(function () {
  document.body.classList.add("spaghettilab-deep-theme");

  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 180ms ease";
  requestAnimationFrame(function () {
    document.body.style.opacity = "1";
  });
})();
