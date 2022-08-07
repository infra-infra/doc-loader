// Custom markdown loader
import path from 'path';
import fs from 'fs';
import fm from 'front-matter';
import loaderUtils from 'loader-utils';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { ParseResult } from '@babel/parser';
import {
  jsxAttribute,
  jsxIdentifier,
  jsxElement,
  jsxOpeningElement,
  jsxClosingElement,
  stringLiteral,
  File,
  JSXElement,
  JSXIdentifier,
  JSXText,
  JSXAttribute, ExpressionStatement,
} from '@babel/types';

import marked from './parser/marked';
import babelParse from './parser/babel';
import compilerDemo from './compiler/demo';
import compilerChangelog from './compiler/changelog';
import { processReactAst } from './compiler/react';
import { htmlToJsx, htmlToJsxWithHelmet } from './jsx';
import parseHeaderFromMarkdown from './utils/parseHeaderFromMarkdown';
import { isObject } from './utils/is';
import getProps from "./utils/getProps";

export interface ArcoMarkdownLoaderOptions {
  preprocess?: (string) => string;
  autoHelmet?:
    | boolean
    | {
        formatTitle: (string) => string;
      };
  demoDir?: string;
}

const PLACEHOLDER_DEMO = 'API';

function loaderForCommonDoc(ast: ParseResult<File>, attribute: JSXAttribute) {
  traverse(ast, {
    JSXElement: (_path) => {
      _path.node.openingElement.attributes.push(attribute);
      _path.stop();
    },
  });
  processReactAst(ast);
  return generate(ast).code;
}

function loaderForArcoComponentDoc(
  markdownAst: ParseResult<File>,
  markdownClassAttribute: JSXAttribute,
  markdownClassAttributeApiContainer: JSXAttribute,
  loaderOptions: ArcoMarkdownLoaderOptions
) {
  let ast;
  let lang = '';
  if (this.resourcePath) {
    const en = this.resourcePath.match('.en-US.md') ? 'en-US' : '';
    const zh = this.resourcePath.match('.zh-CN.md') ? 'zh-CN' : '';
    lang = en || zh;
  }
  try {
    ast = compilerDemo(this.context, loaderOptions, lang);
    const demoPath = path.resolve(this.context, loaderOptions.demoDir || 'demo');
    const demos = fs.readdirSync(demoPath);
    // 添加依赖项，对应的demo文件改变，触发重新编译
    demos.forEach((file) => {
      this.addDependency(`${demoPath}/${file}`);
    });
  } catch (err) {
    if (err.syscall !== 'scandir' || err.code !== 'ENOENT') {
      console.error(err);
    }
  }

  const commonImports = babelParse(`
    import { CodeBlockWrapper, CellCode, CellDemo, CellDescription, Browser } from "@dekopon/site";
  `).program.body;

  traverse(markdownAst, {
    JSXElement: (_path) => {
      const { value: valueOfFirstChild } = (_path.node.children[0] as JSXText) || { value: '' };
      const { name: nameOfOpeningElement } = _path.node.openingElement.name as JSXIdentifier;
      if (nameOfOpeningElement === 'h2' && valueOfFirstChild === PLACEHOLDER_DEMO) {
        // 防止 markdown 样式影响组件样式，所以只给 markdown 内容添加 markdown-body 的类名
        const prevs = _path.getAllPrevSiblings();
        const nexts = _path.getAllNextSiblings();

        const prevSpan = jsxElement(
          jsxOpeningElement(jsxIdentifier('span'), [markdownClassAttribute]),
          jsxClosingElement(jsxIdentifier('span')),
          prevs.map((prev) => prev.node as JSXElement)
        );
        const nextSpan = jsxElement(
          jsxOpeningElement(jsxIdentifier('span'), [
            markdownClassAttributeApiContainer,
          ]),
          jsxClosingElement(jsxIdentifier('span')),
          nexts.map((prev) => prev.node as JSXElement)
        );

        prevs.forEach((prev) => {
          prev.remove();
        });
        nexts.forEach((next) => {
          next.remove();
        });

        _path.insertBefore([prevSpan]);
        _path.insertAfter([nextSpan]);

        const expressionStatement = babelParse('<Component />').program.body[0] as ExpressionStatement
        const element = expressionStatement.expression
        _path.insertBefore(element);
        this.addDependency(path.resolve(this.context, `index.tsx`));
        const propsExpressionStatement = babelParse(getProps(this.context)).program.body[0] as ExpressionStatement
        const propsElement = propsExpressionStatement.expression
        _path.insertAfter(propsElement)
        _path.stop();
      }
    },
  });

  traverse(markdownAst, {
    FunctionDeclaration: (_path) => {
      if (ast) {
        _path.insertBefore(commonImports);
        _path.insertBefore(ast);
      }
      _path.stop();
    },
  });

  processReactAst(markdownAst);

  return generate(markdownAst).code;
}

export default function (rawContent: string) {
  const loaderOptions: ArcoMarkdownLoaderOptions = loaderUtils.getOptions(this) || {};

  if (typeof loaderOptions.preprocess === 'function') {
    rawContent = loaderOptions.preprocess(rawContent);
  }

  const {
    markdown: markdownContent,
    headerHtml,
    title,
    description,
  } = parseHeaderFromMarkdown(
    rawContent,
    isObject(loaderOptions.autoHelmet) && (loaderOptions.autoHelmet as any).formatTitle
  );

  // compile changelog
  const source = fm<{ [key: string]: any }>(markdownContent);
  const attributes = source.attributes;
  if (attributes.changelog) {
    return compilerChangelog(source.body, headerHtml);
  }
  const markdownClassAttribute = jsxAttribute(
    jsxIdentifier('className'),
    stringLiteral('markdown-body')
  );
  const markdownClassAttributeApiContainer = jsxAttribute(
    jsxIdentifier('className'),
    stringLiteral('markdown-body api-container')
  );
  const markdownAst = babelParse(
    headerHtml && loaderOptions.autoHelmet
      ? htmlToJsxWithHelmet(`${headerHtml}${marked(markdownContent)}`, title, description)
      : htmlToJsx(`${headerHtml}${marked(markdownContent)}`)
  );

  return rawContent.indexOf(PLACEHOLDER_DEMO) === -1
    ? loaderForCommonDoc.call(this, markdownAst, markdownClassAttribute)
    : loaderForArcoComponentDoc.call(
        this,
        markdownAst,
        markdownClassAttribute,
        markdownClassAttributeApiContainer,
        loaderOptions
      );
}
