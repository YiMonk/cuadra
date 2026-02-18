import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

// Custom Palette from User (MD3 Polish)
const customColors = {
  primary: '#834AD9',      // Vivid Purple
  secondary: '#7927F5',    // Violet/Blue
  backgroundDark: '#14182aff', // Dark Teal/Black
  surfaceDark: '#0b0f21ff',    // Slightly lighter teal for differentiation
  onDark: '#E6E1E5',       // Light text for dark mode
  error: '#BA1A1A',
};

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: customColors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    secondary: customColors.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    background: '#FFFFFF',
    surface: '#F7F2FA', // Slight purple tint for warmth
    onSurface: '#1C1B1F',
    onBackground: '#1C1B1F',
    elevation: {
      level0: 'transparent',
      level1: '#F7F2FA',
      level2: '#F3EDF7',
      level3: '#F0E8F4',
      level4: '#EFE7F3',
      level5: '#ECE6F2',
    },
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF', // Lighter purple for dark mode accessibility
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    secondary: '#CCC2DC', // Lighter violet for dark mode
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    background: customColors.backgroundDark,
    surface: customColors.surfaceDark,
    onBackground: customColors.onDark,
    onSurface: customColors.onDark,
    elevation: {
        level0: 'transparent',
        level1: '#1c213a', 
        level2: '#212845',
        level3: '#262f50',
        level4: '#283256',
        level5: '#2c375f',
      },
  },
};
