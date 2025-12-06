import Cookies from 'js-cookie';

const COOKIE_NAME = 'nam-survey-color-scheme';
const COOKIE_MAX_AGE = 365; // days

export type ColorScheme = 'light' | 'dark';

export const getColorSchemeCookie = (): ColorScheme | null => {
  const value = Cookies.get(COOKIE_NAME);
  return value === 'dark' ? 'dark' : value === 'light' ? 'light' : null;
};

export const setColorSchemeCookie = (scheme: ColorScheme): void => {
  Cookies.set(COOKIE_NAME, scheme, {
    expires: COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: window.location.protocol === 'https:', // Only secure in production (HTTPS)
  });
};
