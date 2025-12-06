import { useState } from 'react';
import { ColorScheme, getColorSchemeCookie, setColorSchemeCookie } from '../utils/cookies';

const getSystemPreference = (): ColorScheme => {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const getInitialColorScheme = (): ColorScheme => {
  // Priority: cookie → system preference → light (default)
  const cookieValue = getColorSchemeCookie();
  if (cookieValue) {
    return cookieValue;
  }
  return getSystemPreference();
};

export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getInitialColorScheme);

  const toggleColorScheme = () => {
    const newScheme: ColorScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
    setColorSchemeCookie(newScheme);
  };

  const setColorSchemeValue = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    setColorSchemeCookie(scheme);
  };

  return {
    colorScheme,
    toggleColorScheme,
    setColorScheme: setColorSchemeValue,
  };
};
