import { FiledType } from "../Field";
import { CustomFieldMeta } from "./CustomFieldMeta";
/**
 * 继承模式
 */
export declare enum FieldExtendMode {
    Sub = "-",
    Add = "+"
}
export declare class FieldMeta {
    /**
     * 源名称
     */
    data: string;
    /**
     * 导出类型
     */
    type?: FiledType;
    /**
     * 导出名称
     */
    exportName?: string;
    /**
     * 继承模式
     */
    extendMode: FieldExtendMode;
    name: string;
    /**
     * 自定义元信息
     */
    customMetas: CustomFieldMeta[];
    addCustomMeta(s: string): void;
    constructor(
    /**
     * 源名称
     */
    data: string);
}
