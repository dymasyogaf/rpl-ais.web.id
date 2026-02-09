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
