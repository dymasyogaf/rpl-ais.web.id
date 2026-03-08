/**
 * Shared layout helper for subpages (latihan/tools).
 * Loads navbar/footer partials and normalizes relative links.
 */
(function () {
  function getFooterFallbackMarkup(homeHref) {
    return `<!-- Footer -->
<footer class="relative z-10 py-12 px-6 bg-dark/50 backdrop-blur-md border-t border-white/5">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
    <div class="text-center md:text-left">
      <a href="${homeHref}" class="font-heading font-bold text-xl text-white flex items-center gap-2 justify-center md:justify-start">
        <div class="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
          <i class="fa-solid fa-code text-white text-xs"></i>
        </div>
        RPL-AIS
      </a>
      <p class="text-slate-500 text-sm mt-3">Mencetak Generasi Programmer Masa Depan.</p>
    </div>

    <div class="flex gap-4">
      <a href="#" class="btn-footer-social instagram">
        <i class="fa-brands fa-instagram"></i>
      </a>
      <a href="#" class="btn-footer-social tiktok">
        <i class="fa-brands fa-tiktok"></i>
      </a>
      <a href="#" class="btn-footer-social youtube">
        <i class="fa-brands fa-youtube"></i>
      </a>
    </div>
  </div>
  <div class="mt-12 pt-8 border-t border-white/5 text-center text-xs text-slate-600">
    &copy; 2026 Jurusan RPL. All rights reserved. Crafted with <i class="fa-solid fa-heart text-primary mx-1"></i>
    by RPL Team.
  </div>
</footer>`;
  }

  function resolveSharedLayoutRootUrl() {
    const script =
      document.currentScript ||
      Array.from(document.scripts).find((item) =>
        /assets\/js\/shared-layout\.js($|\?)/.test(item.src || ""),
      );

    if (!script || !script.src) return null;

    try {
      return new URL("../../", script.src);
    } catch {
      return null;
    }
  }

  async function loadComponent(containerId, filePath) {
    const container = document.getElementById(containerId);
    if (!container) return false;

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error("Failed to load " + filePath + ": " + response.status);
      }
      container.innerHTML = await response.text();
      return true;
    } catch (error) {
      console.error("Error loading component:", error);
      return false;
    }
  }

  function updateLinks(root, selector, href) {
    if (!root) return;
    root.querySelectorAll(selector).forEach((link) => {
      link.setAttribute("href", href);
    });
  }

  function normalizeLatihanLinks() {
    const navbarContainer = document.getElementById("navbar-container");
    if (navbarContainer) {
      const homeHashMap = {
        "#": "../index.html",
        "#about": "../index.html#about",
        "#stack": "../index.html#stack",
        "#prospek": "../index.html#prospek",
        "#siswa": "../index.html#siswa",
      };

      Object.entries(homeHashMap).forEach(([from, to]) => {
        updateLinks(navbarContainer, `a[href="${from}"]`, to);
      });

      updateLinks(
        navbarContainer,
        'a[href="latihan/"], a[href="latihan/latihan-1.html"], a[href="latihan.html"]',
        "index.html",
      );
      updateLinks(navbarContainer, 'a[href="tools/"], a[href="tools/index.html"]', "../tools/");
    }

    const footerContainer = document.getElementById("footer-container");
    if (footerContainer) {
      const footerLogo = footerContainer.querySelector("a.font-heading");
      if (footerLogo) footerLogo.setAttribute("href", "../index.html");
    }
  }

  function normalizeToolsLinks() {
    const navbarContainer = document.getElementById("navbar-container");
    if (navbarContainer) {
      navbarContainer.querySelectorAll("a[href]").forEach((link) => {
        const href = link.getAttribute("href");
        if (!href) return;

        if (href === "#") {
          link.setAttribute("href", "../");
          return;
        }

        if (href === "tools/") {
          link.setAttribute("href", "./");
          return;
        }

        if (href === "latihan/") {
          link.setAttribute("href", "../latihan/");
          return;
        }

        if (href.startsWith("#")) {
          link.setAttribute("href", "../" + href);
        }
      });
    }

    const footerContainer = document.getElementById("footer-container");
    if (footerContainer) {
      const brandLink = footerContainer.querySelector("a.font-heading");
      if (brandLink) brandLink.setAttribute("href", "../");
    }
  }

  async function initLatihanLayout() {
    const [, isFooterLoaded] = await Promise.all([
      loadComponent("navbar-container", "../components/sections/navbar.html"),
      loadComponent("footer-container", "../components/sections/footer.html"),
    ]);

    if (!isFooterLoaded) {
      const footerContainer = document.getElementById("footer-container");
      if (footerContainer && !footerContainer.innerHTML.trim()) {
        footerContainer.innerHTML = getFooterFallbackMarkup("../index.html");
      }
    }

    normalizeLatihanLinks();
    document.dispatchEvent(new CustomEvent("components:loaded"));
  }

  async function initToolsLayout() {
    const [, isFooterLoaded] = await Promise.all([
      loadComponent("navbar-container", "../components/sections/navbar.html"),
      loadComponent("footer-container", "../components/sections/footer.html"),
    ]);

    if (!isFooterLoaded) {
      const footerContainer = document.getElementById("footer-container");
      if (footerContainer && !footerContainer.innerHTML.trim()) {
        footerContainer.innerHTML = getFooterFallbackMarkup("../");
      }
    }

    normalizeToolsLinks();
    document.dispatchEvent(new CustomEvent("components:loaded"));
  }

  async function initFooterOnly(basePath) {
    const rootPath = typeof basePath === "string" && basePath ? basePath : "./";
    const homeHref = `${rootPath}index.html`;
    const footerContainer = document.getElementById("footer-container");

    const isFooterLoaded = await loadComponent(
      "footer-container",
      `${rootPath}components/sections/footer.html`,
    );

    if (!isFooterLoaded && footerContainer && !footerContainer.innerHTML.trim()) {
      footerContainer.innerHTML = getFooterFallbackMarkup(homeHref);
    }

    if (footerContainer) {
      const brandLink = footerContainer.querySelector('a[href="#"]');
      if (brandLink) {
        brandLink.setAttribute("href", homeHref);
      }
    }

    document.dispatchEvent(new CustomEvent("components:loaded"));
  }

  async function autoInitFooterIfNeeded() {
    const footerContainer = document.getElementById("footer-container");
    if (!footerContainer) return;
    if (footerContainer.innerHTML.trim()) return;

    const rootUrl = resolveSharedLayoutRootUrl();
    if (rootUrl) {
      const footerUrl = new URL("components/sections/footer.html", rootUrl).href;
      const homeUrl = new URL("index.html", rootUrl).href;
      const isFooterLoaded = await loadComponent("footer-container", footerUrl);

      if (!isFooterLoaded && !footerContainer.innerHTML.trim()) {
        footerContainer.innerHTML = getFooterFallbackMarkup(homeUrl);
      }

      const brandLink = footerContainer.querySelector("a.font-heading");
      if (brandLink) brandLink.setAttribute("href", homeUrl);
      return;
    }

    footerContainer.innerHTML = getFooterFallbackMarkup("../index.html");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInitFooterIfNeeded, { once: true });
  } else {
    autoInitFooterIfNeeded();
  }

  window.RPLSharedLayout = {
    initLatihanLayout,
    initToolsLayout,
    initFooterOnly,
  };
})();
