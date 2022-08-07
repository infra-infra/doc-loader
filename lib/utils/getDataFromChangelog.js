"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataFromChangelog = void 0;
const marked_1 = __importDefault(require("../parser/marked"));
const getType = (text) => {
    if (/注意|attention/i.test(text)) {
        return 'attention';
    }
    if (/feature|功能/i.test(text)) {
        return 'feature';
    }
    if (/bugfix|问题/i.test(text)) {
        return 'bugfix';
    }
    if (/优化|optimization|performance|enhancement/i.test(text)) {
        return 'optimization';
    }
    if (/typescript|类型/i.test(text)) {
        return 'typescript';
    }
    if (/style|样式/i.test(text)) {
        return 'style';
    }
    if (/chore|架构/i.test(text)) {
        return 'chore';
    }
    return 'unknown';
};
const addChangelog = (data, list) => {
    let lastVer = list[list.length - 1];
    if (!lastVer || lastVer.version !== data.version) {
        lastVer = {
            version: data.version,
            date: data.date,
        };
        list.push(lastVer);
    }
    if (!lastVer[data.type]) {
        lastVer[data.type] = [];
    }
    lastVer[data.type].push(...data.content);
};
const getContent = (token) => {
    const content = [];
    if (token.tokens.length > 1) {
        for (const subToken of token.tokens) {
            if (subToken.type === 'list') {
                for (const subItem of subToken.items) {
                    content.push(subItem.text);
                }
                return content;
            }
        }
    }
    content.push((0, marked_1.default)(token.text));
    return content;
};
const getDataFromChangelog = (content) => {
    const tokens = marked_1.default.lexer(content);
    const total = [];
    const current = { version: '', date: '' };
    tokens.forEach((item, index) => {
        if (item.type === 'heading' && item.depth === 2) {
            current.version = item.text;
        }
        else if (item.type === 'paragraph') {
            current.date = item.text;
        }
        else if (item.type === 'heading' && item.depth === 3) {
            const type = getType(item.text);
            const listToken = tokens[index + 1];
            for (const item of listToken.items) {
                const content = getContent(item);
                addChangelog(Object.assign({ type,
                    content }, current), total);
            }
        }
    });
    return total;
};
exports.getDataFromChangelog = getDataFromChangelog;
