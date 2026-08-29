import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade visual da Comunidade DGS
        brand: {
          DEFAULT: "#9ACD32", // verde-limão do logo
          dark: "#7FAF26",
        },
        ink: {
          950: "#020201",
          900: "#050503",
          800: "#0c0e09",
          700: "#14170f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
