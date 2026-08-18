/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8f1',
          100: '#feeedc',
          200: '#fddab8',
          300: '#fbbe89',
          400: '#f89a54',
          500: '#f57424',
          550: '#ea580c', // Deep rich orange
          600: '#e05300', // Core primary brand orange
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card-glow': '0 12px 32px -8px rgba(245, 116, 36, 0.28)',
        'card-float': '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
        'btn-orange': '0 8px 24px -4px rgba(224, 83, 0, 0.42)',
        'nav-bar': '0 -8px 25px rgba(15, 23, 42, 0.05)',
        'modal-pop': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'laser-sweep': 'laser 2s ease-in-out infinite',
      },
      keyframes: {
        laser: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(180px)' },
        }
      }
    },
  },
  plugins: [],
}
