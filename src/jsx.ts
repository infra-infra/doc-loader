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

      return (
        <span style={props.style}>${html
          .replace(/class=/g, 'className=')
          .replace(/{/g, '{"{"{')
          .replace(/}/g, '{"}"}')
          .replace(/{"{"{/g, '{"{"}')}</span>
      );
    };`;
}
