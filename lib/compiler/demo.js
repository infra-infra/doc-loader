"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// compile demo folder
const template_1 = __importDefault(require("@babel/template"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const generator_1 = __importDefault(require("@babel/generator"));
const core_1 = require("@babel/core");
const types_1 = require("@babel/types");
const getMeta_1 = __importDefault(require("../getMeta"));
const marked_1 = __importDefault(require("../parser/marked"));
const babel_1 = __importDefault(require("../parser/babel"));
const jsx_1 = require("../jsx");
const linkSvg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="4">
<path d="M14.1006 25.4142L9.15084 30.3639C6.8077 32.7071 6.8077 36.5061 9.15084 38.8492C11.494 41.1924 15.293 41.1924 17.6361 38.8492L26.1214 30.3639C28.4646 28.0208 28.4645 24.2218 26.1214 21.8786M33.8996 22.5858L38.8493 17.636C41.1925 15.2929 41.1925 11.4939 38.8493 9.15072C36.5062 6.80758 32.7072 6.80758 30.364 9.15072L21.8788 17.636C19.5356 19.9792 19.5356 23.7781 21.8788 26.1213" stroke-linecap="butt"></path>
</svg>`;
function compileDemo(context, options, lang) {
    const babelConfig = options.babelConfig || {};
    const metadata = (0, getMeta_1.default)(context, options, lang);
    /** ********************** */
    const demoList = [];
    metadata
        .filter((meta) => !meta.attributes.skip)
        .forEach((meta, index) => {
        if (!meta.jsCode) {
            return false;
        }
        const { title, description } = meta.attributes;
        const markedBodyAddHeader = `<h2 class="ac-demo-title"><a tabindex="-1" href="#${title}">${linkSvg}</a>${title}</h2>${description && (0, marked_1.default)(description)}`;
        const descriptionOriginAst = (0, babel_1.default)((0, jsx_1.dangerouslySetInnerHTMLToJsx)(markedBodyAddHeader));
        const codeOriginAst = (0, babel_1.default)((0, jsx_1.dangerouslySetInnerHTMLToJsx)((0, marked_1.default)(`\`\`\`js\n${meta.jsCode}\n\`\`\``)));
        let cssCodeOriginAst;
        if (meta.cssCode) {
            cssCodeOriginAst = (0, babel_1.default)((0, jsx_1.dangerouslySetInnerHTMLToJsx)((0, marked_1.default)(`\`\`\`css\n${meta.cssCode}\n\`\`\``)));
        }
        let codePreviewBlockAst;
        let cssCodePreviewBlockAst;
        let descriptionAst;
        let tsCodePreviewBlockAst;
        const codeAttrs = [];
        // 存疑
        if (meta.tsCode) {
            const tsCodeAst = (0, babel_1.default)((0, jsx_1.dangerouslySetInnerHTMLToJsx)((0, marked_1.default)(`\`\`\`js\n${meta.tsCode}\n\`\`\``)));
            (0, traverse_1.default)(tsCodeAst, {
                JSXElement: (_path) => {
                    tsCodePreviewBlockAst = _path.node;
                    _path.stop();
                },
            });
            codeAttrs.push((0, types_1.jsxAttribute)((0, types_1.jsxIdentifier)('tsx'), tsCodePreviewBlockAst));
        }
        if (meta.cssCode) {
            codeAttrs.push((0, types_1.jsxAttribute)((0, types_1.jsxIdentifier)('cssCode'), (0, types_1.stringLiteral)(meta.cssCode)));
        }
        (0, traverse_1.default)(descriptionOriginAst, {
            JSXElement: (_path) => {
                descriptionAst = _path.node;
                _path.stop();
            },
        });
        (0, traverse_1.default)(codeOriginAst, {
            JSXElement: (_path) => {
                codePreviewBlockAst = _path.node;
                _path.stop();
            },
        });
        if (cssCodeOriginAst) {
            (0, traverse_1.default)(cssCodeOriginAst, {
                JSXElement: (_path) => {
                    cssCodePreviewBlockAst = _path.node;
                    _path.stop();
                },
            });
        }
        // 插入到代码块的第一行
        const ast = (0, babel_1.default)(meta.jsCode);
        (0, traverse_1.default)(ast, {
            ExportDefaultDeclaration(_path) {
                const declaration = _path.node.declaration;
                const identifierName = declaration.name;
                const returnElement = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)(identifierName), []), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)(identifierName)), []);
                const demoElement = meta.attributes.browser
                    ? (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('Browser'), []), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('Browser')), [returnElement])
                    : returnElement;
                const demoCellElement = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('CellDemo'), []), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('CellDemo')), [demoElement]);
                // 源代码块
                const children = [codePreviewBlockAst];
                // 处理 css 代码，展示 + 插入 style 标签到 dom
                if (meta.cssCode) {
                    const subIdentifier = (0, types_1.jsxMemberExpression)((0, types_1.jsxIdentifier)('CellCode'), (0, types_1.jsxIdentifier)('Css'));
                    const cssCodeCellElement = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)(subIdentifier, []), (0, types_1.jsxClosingElement)(subIdentifier), [cssCodePreviewBlockAst]);
                    children.push(cssCodeCellElement);
                    // 如果是 css:silent，那么只展示而不插入 style 标签，避免出现多重 style 相互覆盖
                    if (!meta.cssSilent) {
                        const styleElement = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('style'), []), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('style')), [
                            (0, types_1.jsxExpressionContainer)((0, types_1.templateLiteral)([(0, types_1.templateElement)({ raw: meta.cssCode, cooked: meta.cssCode })], [])),
                        ]);
                        children.push(styleElement);
                    }
                }
                const codeCellElement = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('CellCode'), codeAttrs), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('CellCode')), children);
                // 展开全部代码按钮
                const cellDescriptionProps = [];
                if (index === 0) {
                    cellDescriptionProps.push((0, types_1.jsxAttribute)((0, types_1.jsxIdentifier)('isFirst')));
                }
                const descriptionCellElement = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('CellDescription'), cellDescriptionProps), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('CellDescription')), [descriptionAst]);
                const codeBlockElement = (0, types_1.jsxElement)((0, types_1.jsxOpeningElement)((0, types_1.jsxIdentifier)('CodeBlockWrapper'), [
                    (0, types_1.jsxAttribute)((0, types_1.jsxIdentifier)('id'), (0, types_1.stringLiteral)(title)),
                ]), (0, types_1.jsxClosingElement)((0, types_1.jsxIdentifier)('CodeBlockWrapper')), [descriptionCellElement, demoCellElement, codeCellElement]);
                const app = (0, types_1.variableDeclaration)('const', [
                    (0, types_1.variableDeclarator)((0, types_1.identifier)('__export'), codeBlockElement),
                ]);
                _path.insertAfter(app);
                _path.remove();
            },
        });
        const { code } = (0, core_1.transformFromAstSync)(ast, null, babelConfig);
        const buildRequire = (0, template_1.default)(`
        const NAME = React.memo(() => {
          AST
          return __export;
        })
      `);
        const finalAst = buildRequire({
            NAME: `Demo${index}`,
            AST: code,
        });
        demoList.push((0, generator_1.default)(finalAst).code);
    });
    const buildRequire = (0, template_1.default)(`
    CODE
    class Component extends React.Component {
      render() {
        return React.createElement('span', { className: 'arco-components-wrapper', style: this.props.style }, ${demoList
        .map((_, index) => `React.createElement(Demo${index}, { key: ${index} })`)
        .join(',')});
      }
    }
  `);
    return buildRequire({
        CODE: demoList.join('\n'),
    });
}
exports.default = compileDemo;
