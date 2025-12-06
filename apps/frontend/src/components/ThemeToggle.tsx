import { ActionIcon } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useColorSchemeContext } from '../theme/ColorSchemeContext';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorSchemeContext();
  const dark = colorScheme === 'dark';

  return (
    <ActionIcon
      variant="outline"
      color={dark ? 'yellow' : 'blue'}
      onClick={toggleColorScheme}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      size="lg"
    >
      {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  );
}
