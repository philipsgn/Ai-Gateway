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
          50: "#FAF9F6",
          100: "#F6F5F0", // Calming subdued warm stone canvas
          200: "#EFECE6", // Soft calm panel background
          300: "#E5E1D8", // Gentle understated border
          400: "#D3CEC2", // Border hover
          500: "#A8A295",
          600: "#78716C",
        },
        mint: {
          50: "#F0F5F2", // Soothing muted sage pill
          100: "#E2ECE5",
          200: "#C4DBD0", // Gentle sage border
          300: "#9EBEAD",
          400: "#6B9B82",
          500: "#3E7B5C", // Calming balanced sage emerald (not harsh neon)
          600: "#32654B",
          700: "#27503B",
          800: "#1E3E2E",
          900: "#162E22",
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
          800: "#24292F", // Calm charcoal body
          900: "#181C21", // Deep soft black
        },
      },
      boxShadow: {
        cream: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        "cream-hover": "0 8px 20px -4px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.03)",
        mint: "0 2px 10px -2px rgba(62, 123, 92, 0.18)",
      },
    },
  },
  plugins: [],
};
