/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        nixtio: {
          orange: "#f97316",
          teal: "#14b8a6",
          blue: "#3b82f6",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f8fafc",
          dark: "#020617",
        },
        danger: {
          100: "#fee2e2",
          500: "#b91c1c",
          600: "#991b1b",
        },
        success: {
          100: "#dcfce7",
          500: "#16a34a",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
        subtle: "0 1px 3px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 12px 40px rgba(99, 102, 241, 0.08)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      transitionTimingFunction: {
        "in-out-soft": "cubic-bezier(0.4, 0.0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
