/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#FAF7F2", // Core canvas background
          200: "#F4EFE6", // Subtle panel background
          300: "#EFE8DC", // Delicate card border
          400: "#D8CEBC", // Border hover
          500: "#B8AC96",
          600: "#948772",
        },
        mint: {
          50: "#ECFDF5", // Sweet mint pill background
          100: "#D1FAE5",
          200: "#A7F3D0", // Mint border accent
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981", // Brand primary emerald
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        ink: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280", // Muted text
          600: "#4B5563", // Secondary text
          700: "#374151",
          800: "#1F2937", // Body primary text
          900: "#111827", // Heading deep charcoal
        },
      },
      boxShadow: {
        cream: "0 2px 8px -2px rgba(184, 172, 150, 0.15), 0 1px 4px -1px rgba(0, 0, 0, 0.04)",
        "cream-hover": "0 10px 25px -5px rgba(184, 172, 150, 0.25), 0 4px 10px -2px rgba(0, 0, 0, 0.05)",
        mint: "0 4px 14px -2px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};
