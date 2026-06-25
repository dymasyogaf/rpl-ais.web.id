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
      // DEVELOPMENT MODE: Bypass cache completely
      // const cacheKey = `rpl_comp_v2_${filePath}`;
      // const cachedHtml = sessionStorage.getItem(cacheKey);
      
      // if (cachedHtml) {
      //   container.innerHTML = cachedHtml;
      //   return true;
      // }

      // Tambahkan timestamp di fetch agar benar-benar fresh
      const response = await fetch(`${filePath}?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status}`);
      }
      const html = await response.text();
      // sessionStorage.setItem(cacheKey, html); // Disabling cache set too
      container.innerHTML = html;
      return true;
    } catch (error) {
      console.error("Error loading component:", error);
      container.innerHTML = `<div class="p-8 text-center text-slate-500 border border-red-500/20 bg-red-500/5 rounded-xl mx-auto my-4 max-w-4xl">Gagal memuat komponen eksternal. Silakan periksa koneksi internet atau muat ulang halaman.</div>`;
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
      try {
        registerSpotlightCards();
      } catch (e) {
        console.error("Error registering spotlight cards:", e);
      }
    }

    if (typeof initSkillsGlobe === "function") {
      try {
        initSkillsGlobe();
      } catch (e) {
        console.error("Error initializing skills globe:", e);
      }
    }

    document.dispatchEvent(new CustomEvent("components:loaded"));
  });
});
