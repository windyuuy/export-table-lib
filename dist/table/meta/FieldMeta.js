"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldMeta = exports.FieldExtendMode = void 0;
const CustomFieldMeta_1 = require("./CustomFieldMeta");
/**
 * 继承模式
 */
var FieldExtendMode;
(function (FieldExtendMode) {
    FieldExtendMode["Sub"] = "-";
    FieldExtendMode["Add"] = "+";
})(FieldExtendMode || (exports.FieldExtendMode = FieldExtendMode = {}));
class FieldMeta {
    data;
    /**
     * 导出类型
     */
    type;
    /**
     * 导出名称
     */
    exportName;
    /**
     * 继承模式
     */
    extendMode = FieldExtendMode.Add;
    name;
    /**
     * 自定义元信息
     */
    customMetas = [];
    addCustomMeta(s) {
        let metaS = s.split(" ").slice(2).join(" ");
        let meta = new CustomFieldMeta_1.CustomFieldMeta();
        meta.index = this.customMetas.length;
        meta.key = metaS;
        this.customMetas.push(meta);
    }
    constructor(
    /**
     * 源名称
     */
    data) {
        this.data = data;
        let m = data.match(/(?:\:(\-))?(?:([^\:\=]+)(?:\:([^\:\=]+))?\=)?([^\:\=]+)/);
        let sign = m[1];
        let exportName = m[2];
        let type = m[3];
        let fieldName = m[4];
        this.name = fieldName;
        this.exportName = exportName;
        this.type = type;
        this.extendMode = sign == "-" ? FieldExtendMode.Sub : FieldExtendMode.Add;
    }
}
exports.FieldMeta = FieldMeta;
//# sourceMappingURL=FieldMeta.js.map