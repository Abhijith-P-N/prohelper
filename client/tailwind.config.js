/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#05070d',
          900: '#0a0e18',
          850: '#0d1220',
          800: '#111727',
          700: '#182138',
        },
        accent: {
          DEFAULT: '#00d4a8',
          bright: '#2bffe0',
          dim: '#0a7a66',
          line: '#123f38',
        },
        warn: {
          DEFAULT: '#f5a524',
          soft: '#4d3510',
        },
        danger: {
          DEFAULT: '#f44f5e',
          soft: '#4a1a22',
        },
        info: {
          DEFAULT: '#4ea3ff',
          soft: '#16304e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,212,168,0.25), 0 8px 30px -6px rgba(0,212,168,0.18)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -14px rgba(0,0,0,0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 5s linear infinite',
        'blink': 'blink 1.2s step-end infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}