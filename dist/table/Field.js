"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = exports.TypeList = void 0;
const FieldMeta_1 = require("./meta/FieldMeta");
exports.TypeList = ["any", "number", "number[]", "bool", "bool[]", "string", "string[]", "object", "object[]", "key", "int", "int[]", "long", "long[]", "float", "float[]"];
class Field {
    /**
     * 是否跳过该字段
     */
    skip = false;
    skipOrigin = false;
    /**
     * 导出命名
     */
    name;
    /**
     * 原始命名
     */
    nameOrigin;
    /**
     * 描述文字, 可作为注释
     */
    describe;
    /**
     * 类型名
     */
    type;
    /**
     * 配置的原始类型
     */
    rawType;
    /**
     * 是否唯一
     */
    isUnique = false;
    /**
     * 从左到右出现顺序
     */
    indexOrigin = -1;
    /**
     * 从左到右出现顺序
     */
    index = -1;
    /**
     * 外键表
     */
    fkTableNameOrigin;
    /**
     * 外键类型信息
     */
    fkFieldNameOrigin;
    /**
     * 外键数据表
     */
    fkTable;
    get fkTableName() {
        return this.fkTable?.name;
    }
    /**
     * 外键域
     */
    fkField;
    get fkFieldName() {
        return this.fkField?.name;
    }
    //翻译
    translate = false;
    meta;
    constructor(name, describe, type, rawType) {
        this.nameOrigin = name;
        this.name = name;
        this.describe = describe;
        this.type = type;
        this.rawType = rawType;
    }
    get isFKField() {
        return this.fkTableNameOrigin != null;
    }
    applyMeta(fieldMeta) {
        if (fieldMeta.exportName) {
            this.name = fieldMeta.exportName;
        }
        if (fieldMeta.type) {
            this.type = fieldMeta.type;
        }
        if (fieldMeta.extendMode == FieldMeta_1.FieldExtendMode.Sub) {
            this.skip = true;
        }
        else {
            this.skip = false;
        }
        this.meta = fieldMeta;
    }
}
exports.Field = Field;
//# sourceMappingURL=Field.js.map