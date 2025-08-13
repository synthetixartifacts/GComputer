/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/renderer/**/*.{svelte,ts,js,scss}',
    './app/renderer/index.html'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

