import template from "@babel/template";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import { Node, transformFromAstSync } from "@babel/core";
import {
  identifier,
  jsxAttribute,
  jsxElement,
  jsxIdentifier,
  jsxOpeningElement,
  jsxClosingElement,
  jsxMemberExpression,
  jsxExpressionContainer,
  stringLiteral,
  templateLiteral,
  templateElement,
  variableDeclarator,
  variableDeclaration,
  Identifier,
} from "@babel/types";

import getMeta from "../getMeta";
import marked from "../parser/marked";
import babelParse from "../parser/babel";
import { dangerouslySetInnerHTMLToJsx } from "../jsx";
import babelConfig from "../babel.config";


export default function compileDemo(context) {
  const metadata = getMeta(context);
  /** ********************** */
  const demoList = [];
  metadata
    .filter((meta) => !meta.attributes.skip)
    .forEach((meta, index) => {
      if (!meta.jsCode) {
        return false;
      }

      const { title, description } = meta.attributes;

      const markedBodyAddHeader = `<a class="oc-demo-title" tabindex="-1" href="#${title}">${title}</a>${
        description && marked(description)
      }`;
      const descriptionOriginAst = babelParse(
        dangerouslySetInnerHTMLToJsx(markedBodyAddHeader)
      );
      const codeOriginAst = babelParse(
        dangerouslySetInnerHTMLToJsx(marked(`\`\`\`js\n${meta.jsCode}\n\`\`\``))
      );
      let cssCodeOriginAst;
      if (meta.cssCode) {
        cssCodeOriginAst = babelParse(
          dangerouslySetInnerHTMLToJsx(
            marked(`\`\`\`css\n${meta.cssCode}\n\`\`\``)
          )
        );
      }
      let codePreviewBlockAst;
      let cssCodePreviewBlockAst;
      let descriptionAst;
      let tsCodePreviewBlockAst;
      const codeAttrs = [];

      // 存疑
      if (meta.tsCode) {
        const tsCodeAst = babelParse(
          dangerouslySetInnerHTMLToJsx(
            marked(`\`\`\`js\n${meta.tsCode}\n\`\`\``)
          )
        );
        traverse(tsCodeAst, {
          JSXElement: (_path) => {
            tsCodePreviewBlockAst = _path.node;
            _path.stop();
          },
        });
        codeAttrs.push(
          jsxAttribute(jsxIdentifier("tsx"), tsCodePreviewBlockAst)
        );
      }
      if (meta.cssCode) {
        codeAttrs.push(
          jsxAttribute(jsxIdentifier("cssCode"), stringLiteral(meta.cssCode))
        );
      }
      traverse(descriptionOriginAst, {
        JSXElement: (_path) => {
          descriptionAst = _path.node;
          _path.stop();
        },
      });
      traverse(codeOriginAst, {
        JSXElement: (_path) => {
          codePreviewBlockAst = _path.node;
          _path.stop();
        },
      });
      if (cssCodeOriginAst) {
        traverse(cssCodeOriginAst, {
          JSXElement: (_path) => {
            cssCodePreviewBlockAst = _path.node;
            _path.stop();
          },
        });
      }
      // 插入到代码块的第一行
      const ast = babelParse(meta.jsCode);

      traverse(ast, {
        ExportDefaultDeclaration(_path) {
          const declaration = _path.node.declaration as Identifier;
          const identifierName = declaration.name;
          const returnElement = jsxElement(
            jsxOpeningElement(jsxIdentifier(identifierName), []),
            jsxClosingElement(jsxIdentifier(identifierName)),
            []
          );

          const demoCellElement = jsxElement(
            jsxOpeningElement(jsxIdentifier("CellDemo"), []),
            jsxClosingElement(jsxIdentifier("CellDemo")),
            [returnElement]
          );
          // 源代码块
          const children = [codePreviewBlockAst];
          // 处理 css 代码，展示 + 插入 style 标签到 dom
          if (meta.cssCode) {
            const subIdentifier = jsxMemberExpression(
              jsxIdentifier("CellCode"),
              jsxIdentifier("Css")
            );
            const cssCodeCellElement = jsxElement(
              jsxOpeningElement(subIdentifier, []),
              jsxClosingElement(subIdentifier),
              [cssCodePreviewBlockAst]
            );
            children.push(cssCodeCellElement);
            // 如果是 css:silent，那么只展示而不插入 style 标签，避免出现多重 style 相互覆盖
            if (!meta.cssSilent) {
              const styleElement = jsxElement(
                jsxOpeningElement(jsxIdentifier("style"), []),
                jsxClosingElement(jsxIdentifier("style")),
                [
                  jsxExpressionContainer(
                    templateLiteral(
                      [
                        templateElement({
                          raw: meta.cssCode,
                          cooked: meta.cssCode,
                        }),
                      ],
                      []
                    )
                  ),
                ]
              );
              children.push(styleElement);
            }
          }
          const codeCellElement = jsxElement(
            jsxOpeningElement(jsxIdentifier("CellCode"), codeAttrs),
            jsxClosingElement(jsxIdentifier("CellCode")),
            children
          );
          // 展开全部代码按钮
          const cellDescriptionProps = [];
          const descriptionCellElement = jsxElement(
            jsxOpeningElement(
              jsxIdentifier("CellDescription"),
              cellDescriptionProps
            ),
            jsxClosingElement(jsxIdentifier("CellDescription")),
            [descriptionAst]
          );
          const codeBlockElement = jsxElement(
            jsxOpeningElement(jsxIdentifier("CodeBlockWrapper"), [
              jsxAttribute(jsxIdentifier("id"), stringLiteral(title)),
            ]),
            jsxClosingElement(jsxIdentifier("CodeBlockWrapper")),
            [descriptionCellElement, demoCellElement, codeCellElement]
          );
          const app = variableDeclaration("const", [
            variableDeclarator(identifier("__export"), codeBlockElement),
          ]);
          _path.insertAfter(app);
          _path.remove();
        },
      });
      const { code } = transformFromAstSync(ast, null, babelConfig);
      const buildRequire = template(`
        const NAME = React.memo(() => {
          AST
          return __export;
        })
      `);

      const finalAst = buildRequire({
        NAME: `Demo${index}`,
        AST: code,
      });

      demoList.push(generate(finalAst as Node).code);
    });

  const buildRequire = template(`
    CODE
    class Component extends React.Component {
      render() {
        return React.createElement('span', { style: this.props.style }, ${demoList
          .map(
            (_, index) => `React.createElement(Demo${index}, { key: ${index} })`
          )
          .join(",")});
      }
    }
  `);

  return buildRequire({
    CODE: demoList.join("\n"),
  });
}
