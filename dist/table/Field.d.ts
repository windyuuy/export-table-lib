import { DataTable } from "./DataTable";
import { FieldMeta } from "./meta/FieldMeta";
export type FieldType = "any" | "uid" | "number" | "number[]" | "bool" | "bool[]" | "string" | "object" | "object[]" | "fk" | "string*" | "string[]" | "key" | "fk[]" | "int" | "int[]" | "long" | "long[]" | "float";
export declare const TypeList: string[];
export declare class Field {
    /**
     * 是否跳过该字段
     */
    skip: boolean;
    skipOrigin: boolean;
    /**
     * 导出命名
     */
    name: string;
    /**
     * 原始命名
     */
    nameOrigin: string;
    /**
     * 描述文字, 可作为注释
     */
    describe: string;
    /**
     * 类型名
     */
    type: FieldType;
    /**
     * 配置的原始类型
     */
    rawType: string;
    /**
     * 是否唯一
     */
    isUnique: boolean;
    /**
     * 从左到右出现顺序
     */
    indexOrigin: number;
    /**
     * 从左到右出现顺序
     */
    index: number;
    /**
     * 外键表
     */
    fkTableNameOrigin?: string;
    /**
     * 外键类型信息
     */
    fkFieldNameOrigin?: string;
    /**
     * 外键数据表
     */
    fkTable?: DataTable;
    get fkTableName(): string | undefined;
    /**
     * 外键域
     */
    fkField?: Field;
    get fkFieldName(): string | undefined;
    translate: boolean;
    meta?: FieldMeta;
    constructor(name: string, describe: string, type: FieldType, rawType: string);
    get isFKField(): boolean;
    applyMeta(fieldMeta: FieldMeta): void;
}
