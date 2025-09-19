import { Html, Head, Main, NextScript } from 'next/document';
import React from 'react';

export default function Document() {
  return (
    <Html lang={'ko'}>
      <Head>
        <script src="/js/jquery-3.7.1.min.js" defer></script>
        <script src="/js/printThis.min.js" defer></script>
      </Head>
      <body>
        <Main />
        <div id={'modal'} />
        <NextScript />
      </body>
    </Html>
  );
}
