"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = void 0;
const opt = Object.prototype.toString;
function isObject(obj) {
    return opt.call(obj) === '[object Object]';
}
exports.isObject = isObject;
