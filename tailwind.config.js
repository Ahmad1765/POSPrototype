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
        zinc: {
          850: '#202023',
          925: '#121215',
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'card-glow': '0 10px 28px -6px rgba(245, 116, 36, 0.22)',
        'card-float': '0 12px 30px -10px rgba(0, 0, 0, 0.08)',
        'btn-orange': '0 6px 20px -4px rgba(224, 83, 0, 0.38)',
        'nav-bar': '0 -4px 20px rgba(0, 0, 0, 0.04)',
        'modal-pop': '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
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
