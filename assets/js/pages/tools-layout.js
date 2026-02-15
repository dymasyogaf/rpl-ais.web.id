document.addEventListener("DOMContentLoaded", function () {
  if (!window.RPLSharedLayout || typeof window.RPLSharedLayout.initToolsLayout !== "function") {
    console.error("RPLSharedLayout.initToolsLayout is not available");
    return;
  }

  window.RPLSharedLayout.initToolsLayout();
});
