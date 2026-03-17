/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#FFFFFF',
        card: '#f1e9e1',
        border: '#b39c6c',
        muted: '#64748b',
      },
    },
  },
  plugins: [],
};
