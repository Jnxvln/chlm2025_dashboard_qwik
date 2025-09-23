import {
  createContextId,
  useContext,
  useContextProvider,
  useStore,
  component$,
  Slot,
  useVisibleTask$,
  $,
  type QRL
} from '@builder.io/qwik';

export type Theme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
}

export interface ThemeContextType {
  state: ThemeState;
  toggleTheme: QRL<() => void>;
  setTheme: QRL<(theme: Theme) => void>;
}

export const ThemeContext = createContextId<ThemeContextType>('theme-context');

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = component$(() => {
  const state = useStore<ThemeState>({
    theme: 'light'
  });

  const toggleTheme = $(() => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    state.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  });

  const setTheme = $((theme: Theme) => {
    state.theme = theme;
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  });

  useVisibleTask$(() => {
    // Read the theme that was already set by the inline script
    const currentTheme = document.documentElement.getAttribute('data-theme') as Theme;
    if (currentTheme) {
      state.theme = currentTheme;
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        state.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  });

  useContextProvider(ThemeContext, {
    state,
    toggleTheme,
    setTheme
  });

  return <Slot />;
});