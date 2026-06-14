export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#354024',
        'primary-container': '#4f5c3d',
        'on-primary': '#f3f4f6',
        'on-primary-variant': '#e5e7eb',
        
        secondary: '#896903',
        'secondary-container': '#b8860b',
        'on-secondary': '#f3f4f6',
        
        tertiary: '#4C3D19',
        'tertiary-container': '#6b5d3d',
        'on-tertiary': '#f3f4f6',
        
        surface: '#f9f6f1',
        'surface-bright': '#ffffff',
        'surface-dim': '#e5d7c4',
        'surface-container': '#e5d7c4',
        'surface-container-low': '#f0e8dd',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#1a1a1a',
        'on-surface-variant': '#49454e',
        
        outline: '#79747e',
        'outline-variant': '#d0ccc4',
        
        error: '#b3261e',
        'error-container': '#f9dedc',
        'on-error': '#ffffff',
        'on-error-container': '#410e0b',
      }
    },
  },
  plugins: [],
}