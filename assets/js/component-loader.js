/**
 * Component Loader
 * Memuat semua komponen HTML ke dalam halaman utama
 */

document.addEventListener("DOMContentLoaded", function () {
  // Daftar komponen yang akan dimuat
  const components = [
    { id: "navbar-container", file: "components/sections/navbar.html" },
    { id: "hero-container", file: "components/sections/hero.html" },
    { id: "about-container", file: "components/sections/about.html" },
    { id: "siswa-container", file: "components/sections/siswa.html" },
    { id: "guru-container", file: "components/sections/guru.html" },
    { id: "prospek-container", file: "components/sections/prospek.html" },
    { id: "footer-container", file: "components/sections/footer.html" },
    { id: "chat-container", file: "components/sections/chat.html" },
  ];

  // Fungsi untuk memuat komponen
  async function loadComponent(containerId, filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status}`);
      }
      const html = await response.text();
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = html;
      } else {
        console.warn(`Container with id ${containerId} not found`);
      }
    } catch (error) {
      console.error("Error loading component:", error);
    }
  }

  // Memuat semua komponen
  Promise.all(components.map((component) => loadComponent(component.id, component.file))).then(
    () => {
      // Memanggil fungsi setelah semua komponen dimuat
      // Inisialisasi spotlight cards
      if (typeof registerSpotlightCards === "function") {
        registerSpotlightCards();
      }

      // Inisialisasi skills globe
      if (typeof initSkillsGlobe === "function") {
        initSkillsGlobe();
      }

      document.dispatchEvent(new CustomEvent("components:loaded"));
    },
  );
});
