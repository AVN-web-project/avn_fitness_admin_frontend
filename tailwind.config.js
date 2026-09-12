/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7fa',
          100: '#e5ebf3',
          200: '#cdd8e6',
          300: '#a4bcd3',
          400: '#739bbe',
          500: '#4f7da8',
          600: '#3d638c',
          700: '#325072',
          800: '#2c435f',
          900: '#111827',
          950: '#0b0f19',
        },
        accent: {
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
