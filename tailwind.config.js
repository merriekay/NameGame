/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VS Code Dark+ inspired theme
        'editor': {
          bg: '#1e1e1e',
          'bg-light': '#252526',
          'bg-lighter': '#2d2d30',
          border: '#3e3e42',
          'border-light': '#454545',
        },
        'sidebar': {
          bg: '#252526',
          hover: '#2a2d2e',
        },
        'text': {
          primary: '#cccccc',
          secondary: '#858585',
          muted: '#6a6a6a',
        },
        'accent': {
          blue: '#0e639c',
          'blue-hover': '#1177bb',
          purple: '#7c3aed',
          'purple-hover': '#8b5cf6',
          green: '#059669',
          'green-hover': '#10b981',
          red: '#ef4444',
          'red-hover': '#f87171',
        }
      },
      fontFamily: {
        'mono': ['Monaco', 'Menlo', 'Consolas', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
