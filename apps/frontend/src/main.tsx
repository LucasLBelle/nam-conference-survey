import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { theme } from './theme/theme';
import { useColorScheme } from './hooks/useColorScheme';
import { ColorSchemeContext } from './theme/ColorSchemeContext';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

function AppWithTheme() {
  const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme();

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, toggleColorScheme, setColorScheme }}>
      <MantineProvider theme={theme} forceColorScheme={colorScheme}>
        <Notifications position="top-right" />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </ColorSchemeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithTheme />
  </React.StrictMode>
);