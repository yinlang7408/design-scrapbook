import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // keep old aliases so nothing breaks during transition
        caveat: ['Inter', 'system-ui', 'sans-serif'],
        kalam: ['Inter', 'system-ui', 'sans-serif'],
        dm: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // new minimal palette
        bg: '#ffffff',
        surface: '#f4f4f5',
        border: '#e4e4e7',
        // legacy aliases — map to new grays so old classes still compile
        paper: '#ffffff',
        ink: '#18181b',
        'ink-light': '#71717a',
        rose: '#e4e4e7',
        sage: '#e4e4e7',
        cornflower: '#e4e4e7',
        butter: '#f4f4f5',
        washi: {
          pink: '#f4f4f5',
          blue: '#f4f4f5',
          green: '#f4f4f5',
          yellow: '#f4f4f5',
          lavender: '#f4f4f5',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        // legacy names
        polaroid: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        'polaroid-hover': '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.375rem' },
    },
  },
  plugins: [animate],
};

export default config;
