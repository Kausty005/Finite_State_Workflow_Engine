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
        navy: {
          950: '#040814',
          900: '#070d1e',
          850: '#0b132b',
          800: '#0f1b3b',
          750: '#15244d',
          700: '#1c2e61',
          600: '#273f82',
        },
        electric: {
          blue: '#00d2ff',
          cyan: '#00f5d4',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          purple: '#a855f7',
        },
        surface: {
          dark: '#080e21',
          card: '#0d172e',
          elevated: '#122040',
          border: 'rgba(56, 189, 248, 0.15)',
        }
      },
      boxShadow: {
        'neu-convex': '6px 6px 14px rgba(2, 6, 16, 0.7), -4px -4px 10px rgba(255, 255, 255, 0.03)',
        'neu-pressed': 'inset 3px 3px 6px rgba(2, 6, 16, 0.8), inset -2px -2px 5px rgba(255, 255, 255, 0.04)',
        'neu-glow-blue': '0 0 20px rgba(0, 210, 255, 0.25), 6px 6px 14px rgba(2, 6, 16, 0.6)',
        'neu-glow-violet': '0 0 20px rgba(139, 92, 246, 0.25), 6px 6px 14px rgba(2, 6, 16, 0.6)',
        'neu-glow-cyan': '0 0 20px rgba(0, 245, 212, 0.25), 6px 6px 14px rgba(2, 6, 16, 0.6)',
        'neu-card': '0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 12px rgba(0, 210, 255, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 24px rgba(0, 210, 255, 0.8))' },
        }
      }
    },
  },
  plugins: [],
}

