export default function parseHeaderFromMarkdown(markdown: string, formatTitle?: (string: any) => string): {
    markdown: string;
    headerHtml: string;
    title: string;
    description: string;
};
