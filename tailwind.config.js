/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Anthrazit-Hintergründe
        base: '#1a1c1e',
        surface: '#24272a',
        'surface-2': '#2e3236',
        border: '#3a3f44',
        // Schrift
        'text-primary': '#f5f5f5',
        'text-secondary': '#b5bbc2',
        'text-muted': '#7d848c',
        // Akzent Orange
        accent: '#ff7a1a',
        'accent-dark': '#e05f00',
        'accent-soft': '#3a2a1a',
        // Status
        success: '#3fbf6b',
        danger: '#e5484d',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
