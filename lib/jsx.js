"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlToUsageJsx = exports.htmlToJsxWithHelmet = exports.htmlToJsx = exports.dangerouslySetInnerHTMLToJsx = void 0;
function dangerouslySetInnerHTMLToJsx(html) {
    html = html.replace(/\n/g, '\\\n').replace(/"/g, "'");
    return `import React from 'react';
    export default function() {
      return (
        <div className="code-preview" dangerouslySetInnerHTML={{ __html: "<div>${html}</div>" }} />
      );
    };`;
}
exports.dangerouslySetInnerHTMLToJsx = dangerouslySetInnerHTMLToJsx;
function htmlToJsx(html) {
    return `import React, { useState } from 'react';

    export default function(props) {
      const [isUsage, setIsUsage] = useState(false);
      const [showChangelog, setShowChangelog] = useState(false);
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
exports.htmlToJsx = htmlToJsx;
function htmlToJsxWithHelmet(html, title, description) {
    return `import React, { useState } from 'react';
    import { Helmet } from 'react-helmet';

    export default function(props) {
      const [isUsage, setIsUsage] = useState(false);
      const [showChangelog, setShowChangelog] = useState(false);
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
exports.htmlToJsxWithHelmet = htmlToJsxWithHelmet;
function htmlToUsageJsx(html) {
    return `function Usage(props) {
      return (
        <div className="markdown-body ac-usage" style={props.style}>${html
        .replace(/class=/g, 'className=')
        .replace(/{/g, '{"{"{')
        .replace(/}/g, '{"}"}')
        .replace(/{"{"{/g, '{"{"}')}</div>
      );
    };`;
}
exports.htmlToUsageJsx = htmlToUsageJsx;
