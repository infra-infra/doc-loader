import { withDefaultConfig } from 'react-docgen-typescript'
import path from "path";
import marked from '../parser/marked'
import xss from "xss";
function commentToMarkDown(componentInfo) {
    return componentInfo
        .map((item) => {
            let { props } = item;
            return renderMarkDown(props);
        })
        .join("\n");
}
function renderMarkDown(props) {
    return `
  | 属性 |  类型 | 默认值 | 必填 | 描述 |
  | --- | --- | --- | --- | ---|
  ${Object.keys(props)
        .map((key) => renderProp(key, props[key]))
        .join("")}
  `;
}
function renderProp(
    name,
    { type = { name: "-" }, defaultValue = { value: "-" }, required, description }
) {
    return `| ${name} | ${getType(type)} | ${defaultValue?.value.replace(
        /\|/g,
        "<span>|</span>"
    )} | ${required ? "✓" : "✗"} |  ${description || "-"} |
  `;
}
function getType(type) {
    const handler = {
        enum: (type) =>
            type.value.map((item) => item.value.replace(/'/g, "")).join(" \\| "),
        union: (type) => type.value.map((item) => item.name).join(" \\| "),
    };
    if (typeof handler[type.name] === "function") {
        return handler[type.name](type).replace(/\|/g, "");
    } else {
        return type.name.replace(/\|/g, "");
    }
}
const parse = withDefaultConfig({
    propFilter: (prop) => {
        if (prop.parent == null) {
            return true;
        }
        return prop.parent.fileName.indexOf("node_modules/@types/react") < 0;
    },
}).parse;

function getProps(context) {
    const componentInfo = parse(
        path.resolve(context, `index.tsx`)
    );
    return `<div className="markdown-body api-container">
${xss(marked(commentToMarkDown(componentInfo)))}
</div>`
}
export default getProps
