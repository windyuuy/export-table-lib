"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetMeta = exports.SheetExtendMode = void 0;
const CustomSheetMeta_1 = require("./CustomSheetMeta");
/**
 * 继承模式
 */
var SheetExtendMode;
(function (SheetExtendMode) {
    SheetExtendMode["Sub"] = "-";
    SheetExtendMode["Add"] = "+";
})(SheetExtendMode = exports.SheetExtendMode || (exports.SheetExtendMode = {}));
class SheetMeta {
    data;
    name;
    workbookName;
    sheet;
    constructor(
    /**
     * 源名称
     */
    data) {
        this.data = data;
        let sheetMeta = data.find(d => d.startsWith("#sheet "));
        let m = sheetMeta.match(/\#sheet (\-)?(?:([^\:]+)\:)?([^\:]+)/);
        let sign = m[1];
        let exportSheetName = m[2];
        let sheetName = m[3];
        this.name = sheetName;
        this.exportSheetName = exportSheetName;
        this.extendMode = sign == "-" ? SheetExtendMode.Sub : SheetExtendMode.Add;
    }
    exportSheetName;
    extendMode = SheetExtendMode.Add;
    fieldMetas = [];
    /**
     * 自定义元信息
     */
    customMetas = [];
    addCustomMeta(s) {
        let metaS = s.split(" ").slice(2).join(" ");
        let meta = new CustomSheetMeta_1.CustomSheetMeta();
        meta.index = this.customMetas.length;
        meta.key = metaS;
        this.customMetas.push(meta);
    }
    addFieldMeta(fieldMeta) {
        this.fieldMetas.push(fieldMeta);
    }
}
exports.SheetMeta = SheetMeta;
//# sourceMappingURL=SheetMeta.js.map