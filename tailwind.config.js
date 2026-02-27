import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f6ff',
          100: '#eae8ff',
          200: '#d3ccff',
          300: '#b6a6ff',
          400: '#9a80ff',
          500: '#7f5cff',
          600: '#6439f6',
          700: '#542ed1',
          800: '#4325a6',
          900: '#34207f',
        },
        ds: {
          primary:            '#0d2450',
          'primary-hover':    '#162033',
          'primary-pressed':  '#121a29',
          'primary-fg':       '#ffffff',
          danger:             '#c50707',
          'danger-hover':     '#940505',
          'danger-pressed':   '#620404',
          'danger-fg':        '#ffffff',
          disabled:           '#e6e8eb',
          'disabled-fg':      '#949ba1',
          foreground:         '#0d0d0e',
          'foreground-muted': '#6c757d',
          background:         '#ffffff',
          border:             '#cfd6db',
          'border-hover':     '#b3b9bf',
          'border-focus':     '#0d2450',
          'input-border':     '#b3b9bf',
          neutral:            '#e6e8eb',
          'toggle-off':       '#b3b9bf',
          'toggle-on':        '#0d2450',
          indicator:          '#ffffff',
        },
      },
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
      },
      fontSize: {
        'ds-label':   ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'ds-body':    ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'ds-body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        'ds-xs': '2px',
        'ds-md': '6px',
      },
      spacing: {
        'ds-0.5': '2px',
        'ds-1.5': '6px',
        'ds-2':   '8px',
        'ds-3':   '12px',
        'ds-3.5': '14px',
        'ds-4':   '16px',
        'ds-5':   '20px',
        'ds-8':   '32px',
        'ds-9':   '36px',
        'ds-10':  '40px',
      },
      boxShadow: {
        card: '0 6px 20px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [forms, typography],
};
