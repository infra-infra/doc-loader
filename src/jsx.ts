export function dangerouslySetInnerHTMLToJsx(html: string) {
  html = html.replace(/\n/g, '\\\n').replace(/"/g, "'");
  return `import React from 'react';
    export default function() {
      return (
        <div className="code-preview" dangerouslySetInnerHTML={{ __html: "${html}" }} />
      );
    };`;
}

export function htmlToJsx(html: string) {
  return `import React, { useState } from 'react';

    export default function(props) {
      const lang = localStorage.getItem('arco-lang') || 'zh-CN';
      return (
        <span style={props.style}>${html
          .replace(/class=/g, 'className=')
          .replace(/{/g, '{"{"{')
          .replace(/}/g, '{"}"}')
          .replace(/{"{"{/g, '{"{"}')}</span>
      );
    };`;
}

export function htmlToJsxWithHelmet(html: string, title: string, description: string) {
  return `import React, { useState } from 'react';
    import { Helmet } from 'react-helmet';

    export default function(props) {
      const lang = localStorage.getItem('arco-lang') || 'zh-CN';
      return (
        <span style={props.style}>
          <Helmet>
            <title>${title}</title>
            <meta name="description" content="${description}" />
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
          </Helmet>
          ${html
            .replace(/class=/g, 'className=')
            .replace(/{/g, '{"{"{')
            .replace(/}/g, '{"}"}')
            .replace(/{"{"{/g, '{"{"}')}
        </span>
      );
    };`;
}
