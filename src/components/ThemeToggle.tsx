import { component$ } from '@builder.io/qwik';
import { useTheme } from '~/contexts/theme';
import { SunIcon, MoonIcon } from './icons';

export const ThemeToggle = component$(() => {
  const { state, toggleTheme } = useTheme();

  return (
    <button
      class={`theme-toggle ${state.theme === 'dark' ? 'active' : ''}`}
      onClick$={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div class="toggle-thumb">
        {state.theme === 'light' ? (
          <SunIcon size={12} />
        ) : (
          <MoonIcon size={12} />
        )}
      </div>
    </button>
  );
});