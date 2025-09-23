import { component$, isDev } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet } from '@builder.io/qwik-city';
import { RouterHead } from './components/router-head/router-head';
import { ThemeProvider } from './contexts/theme';

import './global.css';

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charset='utf-8' />
        {!isDev && (
          <link
            rel='manifest'
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <script
          dangerouslySetInnerHTML={`
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme) {
                  document.documentElement.setAttribute('data-theme', theme);
                } else {
                  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                }
              } catch (e) {}
            })();
          `}
        />
        <RouterHead />
      </head>
      <body lang='en'>
        <ThemeProvider>
          <RouterOutlet />
        </ThemeProvider>
      </body>
    </QwikCityProvider>
  );
});
