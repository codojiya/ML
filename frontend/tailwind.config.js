/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          subtle: 'var(--surface-subtle)',
          hover: 'var(--surface-hover)'
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)'
        },
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)'
        },
        crowd: {
          low: 'var(--crowd-low)',
          'low-subtle': 'var(--crowd-low-subtle)',
          mod: 'var(--crowd-moderate)',
          'mod-subtle': 'var(--crowd-moderate-subtle)',
          high: 'var(--crowd-high)',
          'high-subtle': 'var(--crowd-high-subtle)',
          sev: 'var(--crowd-severe)',
          'sev-subtle': 'var(--crowd-severe-subtle)'
        }
      },
      fontFamily: {
        sans: ['"Inter Tight"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '12px'
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        md: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['28px', '34px'],
        '2xl': ['40px', '48px']
      }
    },
  },
  plugins: [],
}
