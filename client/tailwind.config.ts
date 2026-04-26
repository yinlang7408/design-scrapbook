import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        caveat: ['Caveat', 'cursive'],
        kalam: ['Kalam', 'cursive'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        paper: '#faf8f5',
        ink: '#2d2416',
        'ink-light': '#7a6a58',
        rose: '#e8c5c0',
        sage: '#b5c4b1',
        cornflower: '#b4c5d8',
        butter: '#f2e8a8',
        washi: {
          pink: '#f5c6d0',
          blue: '#c5d8f5',
          green: '#c5f5d8',
          yellow: '#f5f0c5',
          lavender: '#d8c5f5',
        },
      },
      boxShadow: {
        polaroid: '0 4px 20px rgba(45, 36, 22, 0.12), 0 1px 4px rgba(45, 36, 22, 0.08)',
        'polaroid-hover': '0 12px 40px rgba(45, 36, 22, 0.18), 0 4px 12px rgba(45, 36, 22, 0.12)',
      },
      borderRadius: { lg: '0.5rem', md: '0.375rem', sm: '0.25rem' },
    },
  },
  plugins: [animate],
};

export default config;
