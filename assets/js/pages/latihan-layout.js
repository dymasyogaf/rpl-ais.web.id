document.addEventListener("DOMContentLoaded", function () {
  if (!window.RPLSharedLayout || typeof window.RPLSharedLayout.initLatihanLayout !== "function") {
    console.error("RPLSharedLayout.initLatihanLayout is not available");
    return;
  }

  window.RPLSharedLayout.initLatihanLayout();
});
