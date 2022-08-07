"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const front_matter_1 = __importDefault(require("front-matter"));
const prettier_1 = __importDefault(require("prettier"));
const core_1 = require("@babel/core");
const marked_1 = __importDefault(require("./parser/marked"));
const is_1 = require("./utils/is");
const getDescriptionFromMdLexer_1 = __importDefault(require("./utils/getDescriptionFromMdLexer"));
const codeRegex = /^(([ \t]*`{3,4})([^\n]*)([\s\S]+?)(^[ \t]*\2))/gm;
const transformTs2Js = (code) => {
    if (!code)
        return "";
    const body = (0, core_1.transform)(code, {
        plugins: [["@babel/plugin-transform-typescript", { isTSX: true }]],
    }).code;
    return prettier_1.default.format(body);
};
const getMetaFromComment = (source, isTsx) => {
    const comments = source.match(/\/\*\*[\s\S]+?\*\//g);
    const tags = {};
    let body = source;
    if (comments && comments[0]) {
        body = body.replace(comments[0], "").trim();
        comments[0]
            .split("\n")
            .map((x) => /^\s?\*\s*(\S)/.test(x) ? x.replace(/^\s?\*\s*(\S)/, "$1") : "")
            .slice(1, -1)
            .join("\n")
            .split("@")
            .forEach(($) => {
            if ($) {
                const parsedTag = $.match(/^(\S+)(?:\s+(\S[\s\S]*))?/);
                if (parsedTag) {
                    const tagTitle = parsedTag[1].replace(/:$/, "");
                    const tagText = parsedTag[2];
                    if (tagTitle) {
                        tags[tagTitle] = tagText && tagText.trim();
                    }
                }
            }
        });
    }
    return {
        attributes: tags,
        jsCode: !isTsx ? body : transformTs2Js(body),
        tsCode: isTsx ? body : null,
    };
};
const availableJs = ["js", "jsx", "javascript", "ts", "tsx", "typescript"];
const availableCss = ["css", "css:silent", "less"];
const availableLangs = availableJs.concat(availableCss);
function getMatches(input) {
    let matches;
    const output = {};
    while ((matches = codeRegex.exec(input))) {
        const lang = matches[3];
        const code = matches[4];
        if (availableLangs.indexOf(lang) > -1) {
            const l = availableJs.indexOf(lang) > -1 ? "js" : "css";
            output[l] = {
                lang,
                code,
                origin: matches[0],
            };
        }
    }
    return output;
}
const getMetaFromMd = (source, lang) => {
    const fmSource = (0, front_matter_1.default)(source);
    const { attributes, body } = fmSource;
    // const str = codeRegex.exec(body);
    const matches = getMatches(body);
    const metaTitle = attributes.title;
    // i18n
    attributes.title = (0, is_1.isObject)(metaTitle) ? metaTitle[lang] : metaTitle;
    let originDescription;
    if (matches.js) {
        originDescription = body.replace(matches.js.origin, "");
        if (matches.css) {
            originDescription = originDescription.replace(matches.css.origin, "");
        }
    }
    else {
        originDescription = body;
    }
    // i18n
    const lexerDescription = marked_1.default.lexer(originDescription);
    attributes.description =
        (0, getDescriptionFromMdLexer_1.default)(lexerDescription, lang) || originDescription;
    const isTsx = ["ts", "tsx", "typescript"].indexOf(matches.js.lang) > -1;
    const ret = {
        attributes,
        jsCode: isTsx ? transformTs2Js(matches.js.code) : matches.js.code,
        tsCode: isTsx ? matches.js.code && matches.js.code.trim() : null,
    };
    if (matches.css) {
        ret.cssCode = matches.css.code;
        if (matches.css.lang === "css:silent") {
            ret.cssSilent = true;
        }
    }
    return ret;
};
function default_1(context, options, lang) {
    const demoDir = options.demoDir || "demo";
    const files = fs_extra_1.default.readdirSync(path_1.default.resolve(context || "", demoDir));
    const metadata = files.map((file) => {
        const source = fs_extra_1.default.readFileSync(path_1.default.resolve(context, demoDir, file), "utf8");
        if (/\.md$/.test(file)) {
            return getMetaFromMd(source, lang);
        }
        return getMetaFromComment(source, /\.(tsx|ts)$/.test(file));
    });
    metadata.sort((a, b) => a.attributes.order - b.attributes.order);
    return metadata;
}
exports.default = default_1;
