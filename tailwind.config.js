/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Lato', 'Arial', 'sans-serif'] },
      colors: {
        forest: '#0B4F6C', pine: '#0B4F6C', lime: '#01BAEF', cream: '#FBFBFF',
        ink: '#13212B', muted: '#5F6B76', line: '#E1E6EC', mist: '#EEF2F6'
      },
      boxShadow: { card: '0 1px 3px rgba(11,79,108,.08)' }
    }
  },
  plugins: []
}
