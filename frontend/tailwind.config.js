/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        coal: {
          50: '#f4f5f7', 100: '#e5e7eb', 200: '#cbd0d8', 300: '#9aa3b0',
          400: '#6b7686', 500: '#4a5568', 600: '#374151', 700: '#27303f',
          800: '#1a212e', 900: '#11161f', 950: '#0a0d13',
        },
        ember: { 500: '#ea580c', 600: '#c2410c' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 3px 0 rgba(17, 22, 31, 0.08), 0 1px 2px -1px rgba(17, 22, 31, 0.08)',
        panel: '0 4px 20px -4px rgba(17, 22, 31, 0.18)',
      },
    },
  },
  plugins: [],
};
