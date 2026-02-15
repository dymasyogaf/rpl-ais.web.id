/**
 * Shared layout helper for subpages (latihan/tools).
 * Loads navbar/footer partials and normalizes relative links.
 */
(function () {
  async function loadComponent(containerId, filePath) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error("Failed to load " + filePath + ": " + response.status);
      }
      container.innerHTML = await response.text();
    } catch (error) {
      console.error("Error loading component:", error);
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
      const footerLogo = footerContainer.querySelector('a[href="#"]');
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
      const brandLink = footerContainer.querySelector("a.font-heading[href='#']");
      if (brandLink) brandLink.setAttribute("href", "../");
    }
  }

  async function initLatihanLayout() {
    await Promise.all([
      loadComponent("navbar-container", "../components/sections/navbar.html"),
      loadComponent("footer-container", "../components/sections/footer.html"),
    ]);

    normalizeLatihanLinks();
    document.dispatchEvent(new CustomEvent("components:loaded"));
  }

  async function initToolsLayout() {
    await Promise.all([
      loadComponent("navbar-container", "../components/sections/navbar.html"),
      loadComponent("footer-container", "../components/sections/footer.html"),
    ]);

    normalizeToolsLinks();
    document.dispatchEvent(new CustomEvent("components:loaded"));
  }

  window.RPLSharedLayout = {
    initLatihanLayout,
    initToolsLayout,
  };
})();
