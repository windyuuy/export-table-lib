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
     * - 特殊类型说明：如果类型声明以 @ 符号开头，那么此 type 判定为 string，可通过 rawType 字段细分转换，通过此方式支持插件中实现或临时实现 export-table-lib 中未受支持的新增类型
     * 	- 后续如果 export-table-lib 中直接支持规范化解析该特殊类型，那么类型声明可去除 @ 开头，而落地到配表阶段，则可以等所有相关配表插件（比如导出c#和lua的插件）全都跟进升级之后，再去除 @ 开头，这样便于兼容升级
     * 	- 举例：
     * 		- 配表中声明新类型 @(int,int)[], 那么在插件中处理时，type 为 string, rawType 为 "@(int,int)[]"，csharp导表插件和lua导表插件中，可通过 rawType 判断是特殊的新增类型，从而细分转换
     * 		- 在export-table-lib 中直接支持规范化解析该特殊类型后，并且 csharp导表插件和lua导表插件都跟进升级之后，可同时支持 (int,int)[] 和 @(int,int)[] 类型声明
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