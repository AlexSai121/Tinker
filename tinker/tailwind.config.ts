import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mirrors DESIGN.md so utility classes stay aligned with the app tokens.
        tinker: {
          primary: '#24211e',
          secondary: '#6f665b',
          tertiary: '#9b7a4f',
          neutral: '#fbf8f1',
          'surface-0': '#f7f2ea',
          'surface-1': '#fbf8f1',
          'surface-2': '#f3ede3',
          'surface-3': '#ede5d8',
          'surface-4': '#ded3c4',
          'text-1': '#24211e',
          'text-2': '#6f665b',
          'text-3': '#9a9083',
          muted: '#afa495',
          danger: '#c98577',
          warning: '#d7a94d',
          success: '#7f9a75',
          info: '#8fa7bb',
        },
        workshop: {
          steel: '#a9bacb',
          pine: '#ebcb7a',
          oak: '#c98577',
          chalk: '#fffdf7',
          concrete: '#ded3c4',
        },
      },
    },
  },
  plugins: [],
};

export default config;
