/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      letterSpacing: {
        tight: "-0.025em",
        tighter: "-0.04em",
      },
      fontSize: {
        // Slightly tighter line heights for a more editorial feel
        "2xl": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        "4xl": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.03em" }],
      },
    },
  },
  plugins: [],
}
