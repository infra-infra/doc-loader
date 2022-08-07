"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prismjs_1 = __importDefault(require("prismjs"));
// 移除 spellcheck warning
prismjs_1.default.hooks.add('wrap', function (env) {
    if (env.type === 'comment') {
        delete env.attributes.spellcheck;
    }
});
const prismjsDir = 'prismjs/components/';
const loadLanguages = require(prismjsDir);
const prismComponents = path_1.default.dirname(require.resolve(prismjsDir));
const components = fs_1.default
    .readdirSync(prismComponents)
    .map((component) => component.replace(/(\.min)?\.js$/, ''));
const uniqComponents = new Set(components);
uniqComponents.delete('index');
uniqComponents.delete('prism-core');
loadLanguages([...uniqComponents].map((c) => c.replace('prism-', '')));
function highlight(code, lang) {
    const language = prismjs_1.default.languages[lang] || prismjs_1.default.languages.autoit;
    return prismjs_1.default.highlight(code, language);
}
exports.default = highlight;
