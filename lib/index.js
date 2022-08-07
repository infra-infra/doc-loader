"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Custom markdown loader
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const front_matter_1 = __importDefault(require("front-matter"));
const loader_utils_1 = __importDefault(require("loader-utils"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const generator_1 = __importDefault(require("@babel/generator"));
const types_1 = require("@babel/types");
const marked_1 = __importDefault(require("./parser/marked"));
const babel_1 = __importDefault(require("./parser/babel"));
const demo_1 = __importDefault(require("./compiler/demo"));
const changelog_1 = __importDefault(require("./compiler/changelog"));
const react_1 = require("./compiler/react");
const jsx_1 = require("./jsx");
const getDataFromChangelog_1 = require("./utils/getDataFromChangelog");
const parseHeaderFromMarkdown_1 = __importDefault(require("./utils/parseHeaderFromMarkdown"));
const is_1 = require("./utils/is");
const PLACEHOLDER_DEMO = 'API';
function loaderForCommonDoc(ast, attribute) {
    (0, traverse_1.default)(ast, {
        JSXElement: (_path) => {
            _path.node.openingElement.attributes.push(attribute);
            _path.stop();
        },
    });
    (0, react_1.processReactAst)(ast);
    return (0, generator_1.default)(ast).code;
}
function loaderForArcoComponentDoc(markdownAst, markdownClassAttribute, markdownClassAttributeApiContainer, loaderOptions) {
    let ast;
    let lang = '';
    if (this.resourcePath) {
        const en = this.resourcePath.match('.en-US.md') ? 'en-US' : '';
        const zh = this.resourcePath.match('.zh-CN.md') ? 'zh-CN' : '';
        lang = en || zh;
    }
    try {
        ast = (0, demo_1.default)(this.context, loaderOptions, lang);
        const demoPath = path_1.default.resolve(this.context, loaderOptions.demoDir || 'demo');
        const demos = fs_extra_1.default.readdirSync(demoPath);
        // 添加依赖项，对应的demo文件改变，触发重新编译
        demos.forEach((file) => {
            this.addDependency(`${demoPath}/${file}`);
        });
    }
    catch (err) {
        if (err.syscall !== 'scandir' || err.code !== 'ENOENT') {
            console.error(err);
        }
    }
    const usagePath = path_1.default.resolve(this.context, `usage/index.${lang}.md`);
    const usageExist = fs_extra_1.default.existsSync(usagePath);
    let usageAst;
    if (usageExist) {
        const usageMd = fs_extra_1.default.readFileSync(usagePath, 'utf8');
        this.addDependency(usagePath);
        const usageJsx = (0, jsx_1.htmlToUsageJsx)((0, marked_1.default)(usageMd));
        usageAst = (0, babel_1.default)(usageJsx).program.body;
    }
    const usageCheck = (0, babel_1.default)('<span style={isUsage ? { display: "none" }: {}} />');
    const usageCheckAttribute = usageCheck.program.body[0].expression.openingElement
        .attributes[0];
    const changelogPath = path_1.default.resolve(this.context, `./__changelog__/index.${lang}.md`);
    const changelogExist = fs_extra_1.default.existsSync(changelogPath);
    let changelog = [];
    if (changelogExist) {
        const fileContent = fs_extra_1.default.readFileSync(changelogPath, 'utf8');
        changelog = (0, getDataFromChangelog_1.getDataFromChangelog)(fileContent);
        this.addDependency(changelogPath);
    }
    const commonImports = (0, babel_1.default)(`
    import { CodeBlockWrapper, CellCode, CellDemo, CellDescription, Browser, Changelog } from "arco-doc-site-components";
    import { Radio as NavRadio, Button as ChangelogBtn, Drawer as ChangelogDrawer } from "@arco-design/web-react";
    const changelog = ${JSON.stringify(changelog)};
  `).program.body;
    (0, traverse_1.default)(markdownAst, {
        JSXElement: (_path) => {
            const { value: valueOfFirstChild } = _path.node.children[0] || { value: '' };
            const { name: nameOfOpeningElement } = _path.node.openingElement.name;
            if (nameOfOpeningElement === 'h2' && valueOfFirstChild === PLACEHOLDER_DEMO) {
                // 防止 markdown 样式影响组件样式，所以只给 markdown 内容添加 markdown-body 的类名
                const prevs = _path.getAllPrevSiblings();
                const nexts = _path.getAllNextSiblings();
                const prevSpan = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('span'), [markdownClassAttribute]), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('span')), prevs.map((prev) => prev.node));
                const nextSpan = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('span'), [
                    markdownClassAttributeApiContainer,
                    usageCheckAttribute,
                ]), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('span')), nexts.map((prev) => prev.node));
                prevs.forEach((prev) => {
                    prev.remove();
                });
                nexts.forEach((next) => {
                    next.remove();
                });
                _path.insertBefore([prevSpan]);
                _path.insertAfter([nextSpan]);
                const ButtonJSX = `<ChangelogBtn
            aria-label="Changelog"
            size="large"
            className="changelog-btn"
            onClick={() => setShowChangelog(true)}
          >
            {lang === 'en-US' ? 'Changelog' : '更新记录'}
          </ChangelogBtn>`;
                const DrawerJSX = `<ChangelogDrawer
            title="发版记录"
            visible={showChangelog}
            onOk={() => setShowChangelog(false)}
            onCancel={() => setShowChangelog(false)}
            width={800}
          >
            <Changelog changelog={changelog}/>
          </ChangelogDrawer>`;
                const componentJsx = usageExist
                    ? `
              <>
              <div className="ac-toolbar">
                <NavRadio.Group
                  options={[
                    { label: lang === 'en-US' ? 'Component' : '组件', value: 'component' },
                    { label: lang === 'en-US' ? 'Usage' : '用法', value: 'usage' }
                  ]}
                  onChange={(value) => setIsUsage(value === 'usage')}
                  type="button"
                  value={isUsage ? 'usage' : 'component'}
                  size="large"
                />
                ${ButtonJSX}
              </div>
                
                <Usage style={!isUsage ? { display: 'none' } : {}} />
                <Component style={isUsage ? { display: 'none' } : {}} />
                ${DrawerJSX}
              </>
            `
                    : `<>
            <div className="ac-toolbar">${ButtonJSX}</div>
            <Component />${DrawerJSX}</>`;
                const expressionStatement = (0, babel_1.default)(componentJsx).program.body[0];
                const element = expressionStatement.expression;
                _path.insertBefore(element);
                _path.stop();
            }
        },
    });
    (0, traverse_1.default)(markdownAst, {
        FunctionDeclaration: (_path) => {
            const functionName = _path.node.id && _path.node.id.name;
            if (usageAst && !functionName) {
                _path.insertBefore(usageAst);
            }
            if (ast) {
                _path.insertBefore(commonImports);
                _path.insertBefore(ast);
            }
            _path.stop();
        },
    });
    (0, react_1.processReactAst)(markdownAst);
    return (0, generator_1.default)(markdownAst).code;
}
function default_1(rawContent) {
    const loaderOptions = loader_utils_1.default.getOptions(this) || {};
    if (typeof loaderOptions.preprocess === 'function') {
        rawContent = loaderOptions.preprocess(rawContent);
    }
    const { markdown: markdownContent, headerHtml, title, description, } = (0, parseHeaderFromMarkdown_1.default)(rawContent, (0, is_1.isObject)(loaderOptions.autoHelmet) && loaderOptions.autoHelmet.formatTitle);
    // compile changelog
    const source = (0, front_matter_1.default)(markdownContent);
    const attributes = source.attributes;
    if (attributes.changelog) {
        return (0, changelog_1.default)(source.body, headerHtml);
    }
    const markdownClassAttribute = (0, types_1.jsxAttribute)((0, types_1.jsxIdentifier)('className'), (0, types_1.stringLiteral)('markdown-body'));
    const markdownClassAttributeApiContainer = (0, types_1.jsxAttribute)((0, types_1.jsxIdentifier)('className'), (0, types_1.stringLiteral)('markdown-body api-container'));
    const markdownAst = (0, babel_1.default)(headerHtml && loaderOptions.autoHelmet
        ? (0, jsx_1.htmlToJsxWithHelmet)(`${headerHtml}${(0, marked_1.default)(markdownContent)}`, title, description)
        : (0, jsx_1.htmlToJsx)(`${headerHtml}${(0, marked_1.default)(markdownContent)}`));
    return rawContent.indexOf(PLACEHOLDER_DEMO) === -1
        ? loaderForCommonDoc.call(this, markdownAst, markdownClassAttribute)
        : loaderForArcoComponentDoc.call(this, markdownAst, markdownClassAttribute, markdownClassAttributeApiContainer, loaderOptions);
}
exports.default = default_1;
