export interface ArcoMarkdownLoaderOptions {
    preprocess?: (string: any) => string;
    autoHelmet?: boolean | {
        formatTitle: (string: any) => string;
    };
    demoDir?: string;
}
export default function (rawContent: string): any;
