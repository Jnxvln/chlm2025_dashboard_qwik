import { component$ } from '@builder.io/qwik';
import { useDocumentHead, useLocation } from '@builder.io/qwik-city';

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();

  // Default title and description
  const defaultTitle = 'CHLM25 Dashboard';
  const title = head.title || defaultTitle;
  const description = head.meta.find(m => m.name === 'description')?.content || 
    'Internal management dashboard for landscape materials, yard inventory, drivers, deliveries, and business operations at C&H.';
  const siteName = 'CHLM25';

  return (
    <>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#2563eb" />
      <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      <meta name="language" content="English" />
      <meta name="author" content="CHLM25" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={loc.url.href} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {/* <meta property="og:image" content="/og-image.png" /> */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={loc.url.href} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      {/* <meta property="twitter:image" content="/twitter-image.png" /> */}

      {/* Favicons */}
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/favicon.png" />

      {/* Canonical URL */}
      <link rel="canonical" href={loc.url.href} />

      {/* Additional SEO */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="application-name" content={siteName} />

      {/* Custom head meta */}
      {head.meta.map((m) => (
        <meta key={m.key} {...m} />
      ))}

      {head.links.map((l) => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map((s) => (
        <style
          key={s.key}
          {...s.props}
          dangerouslySetInnerHTML={s.props?.dangerouslySetInnerHTML || s.style}
        />
      ))}

      {head.scripts.map((s) => (
        <script
          key={s.key}
          {...s.props}
          {...(s.props?.dangerouslySetInnerHTML
            ? {}
            : { dangerouslySetInnerHTML: s.script })}
        />
      ))}
    </>
  );
});
