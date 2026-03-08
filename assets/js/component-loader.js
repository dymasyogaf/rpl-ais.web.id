/**
 * Component Loader
 * Memuat semua komponen HTML ke dalam halaman utama
 */

document.addEventListener("DOMContentLoaded", function () {
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

  // Daftar komponen yang akan dimuat
  const components = [
    { id: "navbar-container", file: "components/sections/navbar.html" },
    { id: "hero-container", file: "components/sections/hero.html" },
    { id: "about-container", file: "components/sections/about.html" },
    { id: "siswa-container", file: "components/sections/siswa.html" },
    { id: "guru-container", file: "components/sections/guru.html" },
    { id: "prospek-container", file: "components/sections/prospek.html" },
    { id: "footer-container", file: "components/sections/footer.html" },
  ];

  // Fungsi untuk memuat komponen
  async function loadComponent(containerId, filePath) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container with id ${containerId} not found`);
      return false;
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status}`);
      }
      const html = await response.text();
      container.innerHTML = html;
      return true;
    } catch (error) {
      console.error("Error loading component:", error);
      return false;
    }
  }

  // Memuat semua komponen
  Promise.all(components.map((component) => loadComponent(component.id, component.file))).then((results) => {
    const footerIndex = components.findIndex((component) => component.id === "footer-container");
    const isFooterLoaded = footerIndex >= 0 ? results[footerIndex] : false;

    if (!isFooterLoaded) {
      const footerContainer = document.getElementById("footer-container");
      if (footerContainer && !footerContainer.innerHTML.trim()) {
        footerContainer.innerHTML = getFooterFallbackMarkup("index.html");
      }
    }

    if (typeof registerSpotlightCards === "function") {
      registerSpotlightCards();
    }

    if (typeof initSkillsGlobe === "function") {
      initSkillsGlobe();
    }

    document.dispatchEvent(new CustomEvent("components:loaded"));
  });
});
