import { createContext, useContext } from 'react';
import { ColorScheme } from '../utils/cookies';

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

export const useColorSchemeContext = () => {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error('useColorSchemeContext must be used within ColorSchemeProvider');
  }
  return context;
};
