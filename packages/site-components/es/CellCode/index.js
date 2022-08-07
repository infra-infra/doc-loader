var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import React from 'react';
import { findDOMNode } from 'react-dom';
import { Button, Message, Tabs, Tooltip } from '@arco-design/web-react';
import { IconCopy, IconCodepen, IconCodeSandbox, IconCode } from '@arco-design/web-react/icon';
import ClipboardJS from 'clipboard';
import { getParameters } from 'codesandbox/lib/api/define';
import Css from './css';
import Short from './short';
// CodePen
var CODEPEN_ENABLE = window.CODEPEN_ENABLE;
var HTML = window.CODEPEN_HTML ||
    '<div id="root" style="padding: 20px;"></div>\n<script>\nconst CONTAINER = document.getElementById("root")\n</script>';
var CSS_EXTERNAL = window.CODEPEN_CSS_EXTERNAL || [
    'https://unpkg.com/@arco-design/web-react/dist/css/arco.css',
];
var JS_EXTERNAL = window.CODEPEN_JS_EXTERNAL || [
    'https://unpkg.com/react@16.x/umd/react.development.js',
    'https://unpkg.com/react-dom@16.x/umd/react-dom.development.js',
    'https://unpkg.com/dayjs@1.x/dayjs.min.js',
    'https://unpkg.com@arco-design/web-react/dist/arco.min.js',
    'https://unpkg.com@arco-design/web-react/dist/arco-icon.min.js',
];
// CodeSandBox
var html = '<div id="root" style="padding: 20px;"></div>';
var CODE_JSX = 'jsx';
var CODE_TSX = 'tsx';
var locales = {
    'zh-CN': {
        copy: '复制',
        copied: '复制成功',
        expand: '展开代码',
        collapse: '收起代码',
        codePen: '在 CodePen 打开',
        codeSandbox: '在 CodeSandBox 打开',
    },
    'en-US': {
        copy: 'Copy',
        copied: 'Copied Success!',
        expand: 'Expand Code',
        collapse: 'Collapse Code',
        codePen: 'Open in CodePen',
        codeSandbox: 'Open in CodeSandBox',
    },
};
var CellCode = /** @class */ (function (_super) {
    __extends(CellCode, _super);
    function CellCode(props) {
        var _this = _super.call(this, props) || this;
        _this.btnCopy = null;
        _this.codeEle = null;
        _this.lang = localStorage.getItem('arco-lang') || 'zh-CN';
        _this.gotoCodepen = function () {
            var codeEle = findDOMNode(_this).querySelector('.language-js');
            var code = codeEle.innerText;
            // codepen
            var postCode = code
                .replace(/import ([.\s\S]*?) from '([.\s\S]*?)'/g, 'const $1 = window.$2')
                .replace(/@arco-design\/web-react/g, 'arco')
                .replace('arco/icon', 'arcoicon')
                .replace(/react-dom/, 'ReactDOM')
                .replace(/react/, 'React')
                .replace(/export default ([.\s\S]*?)(;|$)/, 'ReactDOM.render(<$1 />, CONTAINER)');
            _this.post(postCode);
        };
        _this.getData = function (code) {
            return {
                title: 'Cool Pen',
                html: HTML,
                js: code,
                css: _this.props.cssCode || '',
                js_pre_processor: 'typescript',
                css_external: CSS_EXTERNAL.join(';'),
                js_external: JS_EXTERNAL.join(';'),
                editors: '001',
            };
        };
        _this.post = function (code, codesandbox) {
            var form = document.createElement('form');
            form.action = (codesandbox && codesandbox.url) || 'https://codepen.io/pen/define';
            form.target = '_blank';
            form.method = 'POST';
            form.style.display = 'none';
            var field = document.createElement('input');
            field.name = (codesandbox && codesandbox.name) || 'data';
            field.type = 'hidden';
            field.setAttribute('value', (codesandbox && codesandbox.parameters) ||
                JSON.stringify(_this.getData(code)).replace(/"/g, '&quot;').replace(/'/g, '&apos;'));
            form.appendChild(field);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        };
        _this.toggleCodeType = function () {
            _this.setState(function (prevState) {
                return {
                    codeType: prevState.codeType === CODE_TSX ? CODE_JSX : CODE_TSX,
                };
            });
        };
        _this.toggleCode = function (e) {
            // 修正点击展开按钮时，页面向上滚动而不是向下滚动的问题
            if (!_this.state.showAll) {
                e.target.blur();
            }
            _this.setState({
                showAll: !_this.state.showAll,
            });
        };
        _this.gotoCodeSandBox = function () {
            var _a;
            var codeEle = findDOMNode(_this).querySelector('.language-js');
            var codePrefix = "import '@arco-design/web-react/dist/css/arco.css';\n".concat(_this.props.cssCode ? "import './index.css';\n" : '');
            var code = "".concat(codePrefix, "\n").concat(codeEle.innerText);
            var scriptType = _this.state.codeType === CODE_TSX ? 'tsx' : 'js';
            var sandBoxConfig = {
                files: (_a = {
                        'package.json': {
                            isBinary: false,
                            content: JSON.stringify({
                                dependencies: {
                                    react: '17',
                                    'react-dom': '17',
                                    '@arco-design/web-react': 'latest',
                                },
                            }),
                        }
                    },
                    _a["demo.".concat(scriptType)] = {
                        isBinary: false,
                        content: code,
                    },
                    _a["index.".concat(scriptType)] = {
                        isBinary: false,
                        content: [
                            "import React from 'react'",
                            "import ReactDOM from 'react-dom'",
                            "import Demo from './demo'",
                            "ReactDOM.render(<Demo />, document.getElementById('root'))",
                        ].join('\n'),
                    },
                    _a['index.html'] = {
                        isBinary: false,
                        content: html,
                    },
                    _a),
            };
            if (_this.props.cssCode) {
                sandBoxConfig.files['index.css'] = {
                    isBinary: false,
                    content: _this.props.cssCode,
                };
            }
            // to specific demo file
            var query = "file=/demo.".concat(scriptType);
            _this.post(undefined, {
                url: "https://codesandbox.io/api/v1/sandboxes/define?query=".concat(encodeURIComponent(query)),
                parameters: getParameters(sandBoxConfig),
                name: 'parameters',
            });
        };
        _this.renderOperations = function () {
            var _a = _this.state, showAll = _a.showAll, codeType = _a.codeType;
            var t = locales[_this.lang];
            return (React.createElement("div", { className: "arco-code-operations" },
                _this.props.tsx && (React.createElement(Tabs, { size: "small", justify: true, type: "capsule", activeTab: codeType, onChange: _this.toggleCodeType, className: "code-type-switch ".concat(showAll ? 'show-all' : '') },
                    React.createElement(Tabs.TabPane, { key: CODE_JSX, title: "JS" }),
                    React.createElement(Tabs.TabPane, { key: CODE_TSX, title: "TS" }))),
                React.createElement(Tooltip, { content: showAll ? t.collapse : t.expand },
                    React.createElement(Button, { size: "small", shape: "circle", onClick: _this.toggleCode, type: "secondary", "aria-label": t.collapse, className: showAll ? 'ac-btn-expanded' : '' },
                        React.createElement(IconCode, null))),
                React.createElement(Tooltip, { content: t.copy },
                    React.createElement(Button, { size: "small", shape: "circle", ref: function (ref) { return (_this.btnCopy = ref); }, type: "secondary", "aria-label": t.copy },
                        React.createElement(IconCopy, { className: "copy-icon" }))),
                CODEPEN_ENABLE ? (React.createElement(Tooltip, { content: t.codePen },
                    React.createElement(Button, { size: "small", shape: "circle", onClick: _this.gotoCodepen, type: "secondary", "aria-label": t.codePen },
                        React.createElement(IconCodepen, null)))) : null,
                React.createElement(Tooltip, { content: t.codeSandbox },
                    React.createElement(Button, { size: "small", shape: "circle", onClick: _this.gotoCodeSandBox, type: "secondary", "aria-label": t.codeSandbox },
                        React.createElement(IconCodeSandbox, null)))));
        };
        _this.state = {
            showAll: false,
            codeType: props.tsx ? CODE_TSX : CODE_JSX,
        };
        return _this;
    }
    CellCode.prototype.componentDidMount = function () {
        var _this = this;
        var t = locales[this.lang];
        var clipboard = new ClipboardJS(findDOMNode(this.btnCopy), {
            text: function () {
                return _this.codeEle.querySelector('.language-js').innerText;
            },
        });
        clipboard.on('success', function (e) {
            e.clearSelection();
            Message.success(t.copied);
        });
    };
    CellCode.prototype.render = function () {
        var _this = this;
        var props = this.props;
        var _a = this.state, showAll = _a.showAll, codeType = _a.codeType;
        return (React.createElement("div", { className: "arco-code-wrapper" },
            this.renderOperations(),
            React.createElement("div", { className: "content-code-design ".concat(showAll ? 'show-all' : '') },
                React.createElement("div", { className: "code", ref: function (ref) { return (_this.codeEle = ref); } }, codeType === CODE_TSX ? props.tsx : props.children))));
    };
    return CellCode;
}(React.Component));
CellCode.Css = Css;
CellCode.Short = Short;
export default CellCode;
