"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDuplicateImports = exports.processReactAst = exports.compileReact = void 0;
// Use React component in markdown
const lru_cache_1 = __importDefault(require("lru-cache"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const nanoid_1 = require("nanoid");
const babel_1 = __importDefault(require("../parser/babel"));
const cache = new lru_cache_1.default({
    max: 0,
    maxAge: 1000 * 60 * 10,
});
function compileReact(code) {
    const id = (0, nanoid_1.nanoid)();
    const ast = (0, babel_1.default)(code);
    (0, traverse_1.default)(ast, {
        Program: (_path) => {
            const body = _path.node.body;
            const imports = body.filter((b) => b.type === "ImportDeclaration") || [];
            const expressions = body.filter((b) => b.type === "ExpressionStatement") || [];
            cache.set(id, {
                imports,
                expressions,
            });
            _path.stop();
        },
    });
    return { id, holder: `<section>%%${id}%%</section>` };
}
exports.compileReact = compileReact;
function processReactAst(contentAst) {
    // js:react expressions
    (0, traverse_1.default)(contentAst, {
        JSXElement: (_path) => {
            const { value: valueOfFirstChild } = _path.node
                .children[0] || { value: "" };
            const { name: nameOfOpeningElement } = _path.node.openingElement
                .name;
            if (nameOfOpeningElement === "section" &&
                /%%[0-9a-zA-Z_-]{21}%%/.test(valueOfFirstChild)) {
                const id = valueOfFirstChild.replace(/%%/g, "");
                const cacheAst = cache.get(id);
                if (cacheAst) {
                    _path.replaceWith(cacheAst.expressions[0]);
                    cache.set(id, Object.assign(Object.assign({}, cacheAst), { touched: true }));
                }
            }
        },
    });
    // js:react imports
    cache.forEach((_, key) => {
        if (!cache.get(key).touched) {
            cache.del(key);
        }
    });
    (0, traverse_1.default)(contentAst, {
        ImportDeclaration: (_path) => {
            let allImports = [];
            cache.forEach((c) => {
                allImports = allImports.concat(c.imports);
            });
            _path.insertBefore(removeDuplicateImports(allImports));
            _path.stop();
            cache.reset();
        },
    });
}
exports.processReactAst = processReactAst;
function removeDuplicateImports(allImports) {
    const importsMap = {
        ImportSpecifier: {},
        ImportDefaultSpecifier: {},
        ImportNamespaceSpecifier: {},
    };
    allImports.forEach((imports) => {
        const name = imports.source.value;
        const specifiers = imports.specifiers;
        specifiers.forEach((spec) => {
            if (spec.type === "ImportSpecifier") {
                if (!importsMap.ImportSpecifier[name]) {
                    importsMap.ImportSpecifier[name] = new Set();
                }
                importsMap.ImportSpecifier[name].add(spec.imported.name);
            }
            if (spec.type === "ImportDefaultSpecifier") {
                if (!importsMap.ImportDefaultSpecifier[name]) {
                    importsMap.ImportDefaultSpecifier[name] = new Set();
                }
                importsMap.ImportDefaultSpecifier[name].add(spec.local.name);
            }
            if (spec.type === "ImportNamespaceSpecifier") {
                if (!importsMap.ImportNamespaceSpecifier[name]) {
                    importsMap.ImportNamespaceSpecifier[name] = new Set();
                }
                importsMap.ImportNamespaceSpecifier[name].add(spec.local.name);
            }
        });
    });
    let importStringArr = [];
    const keysImportSpecifier = Object.keys(importsMap.ImportSpecifier);
    const keysImportDefaultSpecifier = Object.keys(importsMap.ImportDefaultSpecifier);
    const keysImportNamespaceSpecifier = Object.keys(importsMap.ImportNamespaceSpecifier);
    if (keysImportSpecifier.length) {
        importStringArr = importStringArr.concat(keysImportSpecifier.map((k) => `import {${[...importsMap.ImportSpecifier[k]].join(",")}} from "${k}";`));
    }
    if (keysImportDefaultSpecifier.length) {
        importStringArr = importStringArr.concat(keysImportDefaultSpecifier.map((k) => `import ${[...importsMap.ImportDefaultSpecifier[k]]} from "${k}";`));
    }
    if (keysImportNamespaceSpecifier.length) {
        importStringArr = importStringArr.concat(keysImportNamespaceSpecifier.map((k) => `import * as ${[
            ...importsMap.ImportNamespaceSpecifier[k],
        ]} from "${k}";`));
    }
    const ast = (0, babel_1.default)(importStringArr.join("\n"));
    return ast.program.body;
}
exports.removeDuplicateImports = removeDuplicateImports;
