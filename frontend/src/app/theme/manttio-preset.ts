import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Aura preset remapped to the manager palette: `primary` = primary scale,
 * `surface` = surface scale. Keep in sync with `tailwind.config.js` so
 * Tailwind utilities and PrimeNG component chrome stay visually consistent.
 */
export const ManttioPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'hsl(212, 76%, 97%)',
      100: 'hsl(210, 75%, 92%)',
      200: 'hsl(210, 75%, 86%)',
      300: 'hsl(209, 74%, 76%)',
      400: 'hsl(210, 73%, 64%)',
      500: 'hsl(216, 70%, 55%)',
      600: 'hsl(218, 64%, 47%)',
      700: 'hsl(219, 63%, 38%)',
      800: 'hsl(219, 58%, 33%)',
      900: 'hsl(219, 52%, 28%)',
      950: 'hsl(221, 49%, 19%)',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: 'hsl(216, 29%, 97%)',
          100: 'hsl(216, 28%, 93%)',
          200: 'hsl(212, 25%, 87%)',
          300: 'hsl(214, 25%, 76%)',
          400: 'hsl(214, 21%, 63%)',
          500: 'hsl(214, 19%, 52%)',
          600: 'hsl(214, 20%, 42%)',
          700: 'hsl(215, 19%, 34%)',
          800: 'hsl(215, 25%, 26%)',
          900: 'hsl(212, 28%, 18%)',
          950: 'hsl(211, 32%, 13%)',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: 'hsl(216, 29%, 97%)',
          100: 'hsl(216, 28%, 93%)',
          200: 'hsl(212, 25%, 87%)',
          300: 'hsl(214, 25%, 76%)',
          400: 'hsl(214, 21%, 63%)',
          500: 'hsl(214, 19%, 52%)',
          600: 'hsl(214, 20%, 42%)',
          700: 'hsl(215, 19%, 34%)',
          800: 'hsl(215, 25%, 26%)',
          900: 'hsl(212, 28%, 18%)',
          950: 'hsl(211, 32%, 13%)',
        },
      },
    },
  },
});
