/**
 * 标准模板文本
 * @param s
 * @returns
 */
export declare function stdtemp(s: string): string;
/**
 * 注释
 * @param a
 * @returns
 */
export declare function cmm(a?: string): string;
/**
 * 表达式
 * @param f
 * @returns
 */
export declare function st(f: (a?: any) => string): string;
/**
 * 遍历列表生成字符串
 * - 会自动去除头尾多余的换行符(LF)
 * @param ls
 * @param f
 * @returns
 */
export declare function foreach<T>(ls: T[], f: (e: T) => string, sign?: string, autoTrim?: boolean): string;
export declare class Cond {
    protected lines: string[];
    protected finished: boolean;
    if(cond: boolean, call: () => string): this | undefined;
    elseif(cond: boolean, call: () => string): this | undefined;
    else(call: () => string): this | undefined;
    toString(): string;
}
export declare function iff(cond: boolean, call: () => string): Cond;
export declare function iff(cond: any, call: () => string): Cond;
/**
 * 首字母大写
 * @param str
 * @returns
 */
export declare function makeFirstLetterUpper(str: string): string;
/**
 * 首字母小写
 * @param str
 * @returns
 */
export declare function makeFirstLetterLower(str: string): string;
export declare function clearSpace(value: string): string;
