"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const marked_1 = __importDefault(require("../parser/marked"));
function parseHeaderFromMarkdown(markdown, formatTitle) {
    const getRawHeader = (str) => {
        const reg = /^(([ \t]*`{5})([^\n]*)([\s\S]+?)(^[ \t]*\2))/m.exec(str);
        return reg && reg[4];
    };
    const getTitle = (str) => {
        const reg = /# (.*)/.exec(str);
        const result = reg && reg[1];
        return formatTitle ? formatTitle(result) : result;
    };
    const getDescription = (str) => {
        const reg = /# .*\n*(.*)/.exec(str);
        return reg && reg[1];
    };
    let title = '';
    let description = '';
    let headerHtml = '';
    const rawHeader = getRawHeader(markdown);
    if (rawHeader) {
        markdown = markdown.replace(`\`\`\`\`\`${rawHeader}\`\`\`\`\``, '');
        headerHtml = `<div className="ac-nav-intro">${(0, marked_1.default)(rawHeader.replace(/(\/) (.*)/, '<span className="separator">$1</span> **$2**'))}</div>`;
        title = getTitle(rawHeader);
        description = getDescription(rawHeader);
    }
    return {
        markdown,
        headerHtml,
        title,
        description,
    };
}
exports.default = parseHeaderFromMarkdown;
