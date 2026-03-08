tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        heading: ["Sora", "sans-serif"],
      },
      colors: {
        primary: "#22D3EE",
        primaryDark: "#0891B2",
        secondary: "#3B82F6",
        dark: "#0B1020",
        card: "#121A2B",
        border: "rgba(255, 255, 255, 0.10)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)",
        glass:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
    },
  },
};

// Inject favicon globally based on this script's path.
(() => {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[rel="icon"]')) return;

  let faviconHref = "assets/favicon.svg";
  const currentScript = document.currentScript;

  if (currentScript && currentScript.src) {
    try {
      faviconHref = new URL("../favicon.svg", currentScript.src).href;
    } catch {
      // Keep default relative path when URL construction fails.
    }
  }

  const faviconLink = document.createElement("link");
  faviconLink.rel = "icon";
  faviconLink.type = "image/svg+xml";
  faviconLink.href = faviconHref;
  document.head.appendChild(faviconLink);
})();
