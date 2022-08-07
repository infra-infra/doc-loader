"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const template_1 = __importDefault(require("@babel/template"));
const generator_1 = __importDefault(require("@babel/generator"));
const marked_1 = __importDefault(require("../parser/marked"));
function compileChangelog(content, prefixHtml) {
    const contentArray = content.split('\n');
    const indexs = [];
    contentArray.forEach((ca, index) => {
        if (/^## /.test(ca)) {
            indexs.push(index);
        }
    });
    const segments = indexs.map((_, i) => {
        if (i + 1 > indexs.length) {
            return contentArray.slice(indexs[i]).join('\n');
        }
        return contentArray.slice(indexs[i], indexs[i + 1]).join('\n');
    });
    const ast = template_1.default.ast(`
    import React from 'react';
    import { Timeline } from '@arco-design/web-react';
    const TimelineItem = Timeline.Item;
  
    export default function() {
      return <>
        ${prefixHtml}
        <Timeline className="page-changelog">
        ${segments
        .map((sg) => {
        const sgc = (0, marked_1.default)(sg);
        const contents = sgc.split('\n');
        contents[0] = `<div>${contents[0]}`;
        contents[1] = `${contents[1]}</div>`;
        contents[2] = `<div>${contents[2]}`;
        contents.push('</div>');
        return `<TimelineItem>
            ${contents
            .join('\n')
            .replace(/class=/g, 'className=')
            .replace(/{/g, '{"{"{')
            .replace(/}/g, '{"}"}')
            .replace(/{"{"{/g, '{"{"}')}
          </TimelineItem>`;
    })
        .join('\n')}
        </Timeline>
      </>;
    }
  `, {
        sourceType: 'module',
        plugins: ['jsx'],
    });
    const finalAst = {
        type: 'Program',
        sourceType: 'module',
        body: ast,
    };
    return (0, generator_1.default)(finalAst).code;
}
exports.default = compileChangelog;
