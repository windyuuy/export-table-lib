/// <reference types="yargs" />
export declare var command: string;
export declare var describe: string;
export declare function builder(yargs: typeof import("yargs")): import("yargs").Argv<import("yargs").Omit<{
    from: string | undefined;
} & {
    to: string | undefined;
} & {
    tags: (string | number)[] | undefined;
} & {
    t: (string | number)[] | undefined;
} & {
    inject: (string | number)[] | undefined;
} & {
    packagename: string | undefined;
} & {
    tableNameFirstLetterUpper: boolean | undefined;
}, "from" | "to"> & {
    from: string;
    to: string;
} & {
    libs: (string | number)[] | undefined;
} & {
    scenes: (string | number)[] | undefined;
}>;
export declare function handler(argv: any): Promise<void>;
