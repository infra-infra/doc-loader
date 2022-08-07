"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("@babel/parser");
function default_1(codeBlock) {
    return (0, parser_1.parse)(codeBlock, {
        sourceType: 'module',
        plugins: ['jsx', 'classProperties'],
    });
}
exports.default = default_1;
