/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        gprimary: "#1a1b26",
        gdark: "#16161e",
        gblue0: "#3d59a1",
        gblue0comp: "#2a3e79",
        gblue: "#7aa2f7",
        gcyan: "#7dcfff",
        gblue1: "#2ac3de",
        gblue2: "#0db9d7",
        gblue5: "#89ddff",
        gblue6: "#b4f9f8",
        gblue7: "#394b70",
        gmagenta: "#bb9af7",
        gmagenta2: "#ff007c",
        gpurple: "#9d7cd8",
        gorange: "#ff9e64",
        gyellow: "#e0af68",
        ggreen: "#9ece6a",
        ggreen1: "#73daca",
        ggreen2: "#41a6b5",
        teal: "#1abc9c",
        gred: "#f7768e",
        gred1: "#db4b4b",
        gviolet: "#AE81FF",
      },
    },
  },
  plugins: [],
};