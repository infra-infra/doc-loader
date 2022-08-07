"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const marked_1 = require("marked");
const highlight_1 = __importDefault(require("./highlight"));
const react_1 = require("../compiler/react");
const renderer = new marked_1.marked.Renderer();
renderer.code = function (code, infostring, escaped) {
    const lang = (infostring || '').match(/\S*/)[0];
    if (lang === 'js:react') {
        return (0, react_1.compileReact)(code).holder;
    }
    if (this.options.highlight) {
        const out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
            escaped = true;
            code = out;
        }
    }
    if (!lang) {
        return `<pre><code>${escaped ? code : escape(code)}</code></pre>`;
    }
    return `<pre class="code_block"><code class="${this.options.langPrefix}${escape(lang)}">${escaped ? code : escape(code)}</code></pre>\n`;
};
marked_1.marked.setOptions({
    gfm: true,
    breaks: true,
    renderer,
    xhtml: true,
    highlight(code, lang) {
        if (lang === 'js' || lang === 'javascript') {
            lang = 'jsx';
        }
        return (0, highlight_1.default)(code, lang).replace(/^\n/, '').replace(/\n/g, '<br />');
    },
});
// sort table api
const walkTokens = (token) => {
    if (token.type === 'table') {
        token.rows.sort((a, b) => a[0].text.localeCompare(b[0].text));
    }
};
marked_1.marked.use({ walkTokens });
exports.default = marked_1.marked;
