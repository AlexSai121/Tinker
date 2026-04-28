import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Workshop color palette
        workshop: {
          steel: '#475569',
          pine: '#fcd34d',
          oak: '#8b5cf6',
          chalk: '#f8fafc',
          concrete: '#94a3b8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
