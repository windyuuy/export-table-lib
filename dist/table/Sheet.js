"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sheet = void 0;
const Cell_1 = require("./Cell");
const xlsx = require("xlsx-color");
const isBoolean = (maybeBoolean) => typeof maybeBoolean === 'boolean';
const isNumber = (maybeNumber) => typeof maybeNumber === 'number';
const isString = (maybeString) => typeof maybeString === 'string';
const isObject = (maybeObject) => maybeObject !== null && typeof maybeObject === 'object';
const isCellDescriptor = (maybeCell) => isObject(maybeCell) && 'v' in maybeCell;
const originDate = new Date(Date.UTC(1899, 11, 30));
const buildExcelDate = (value, is1904) => {
    const epoch = Date.parse((value + (is1904 ? 1462 : 0)));
    return (epoch - originDate) / (864e5);
};
class Sheet {
    constructor() {
    }
    applyMeta(meta) {
        if (meta.exportSheetName) {
            this.name = meta.exportSheetName;
        }
    }
    name = "Sheet1";
    /**
     * sheet在工作簿中的序号(忽略.meta sheet)
     */
    index = 0;
    nameOrigin = "Sheet1";
    isDefault = false;
    workbookName;
    setupName(name) {
        this.nameOrigin = name;
        this.name = name;
    }
    data = [];
    get fullName() {
        if (this.isDefault) {
            return this.name;
        }
        else {
            return `${this.workbookName}-${this.name}`;
        }
    }
    get rowLength() {
        return this.data.length;
    }
    get columnLength() {
        let max = 0;
        for (let list of this.data) {
            max = Math.max(max, list.length);
        }
        return max;
    }
    /**
     * 获取某一行的所有单元
     * 如果该行不存在，则返回空
     * @param index
     */
    getRow(index) {
        let row = this.data[index];
        if (row) {
            return this.data[index].concat();
        }
        else {
            return null;
        }
    }
    /**
     * 获取某一行的数据
     * @param index
     */
    getRowValue(index) {
        let row = this.getRow(index);
        if (row) {
            return row.map(a => a ? a.value : null);
        }
        else {
            return null;
        }
    }
    /**
     * 获取某一列的所有单元
     * 如果该列不存在，则返回空
     * @param index
     */
    getColumn(index) {
        if (index < 0)
            return null;
        let colum = [];
        for (let r = 0; r < this.data.length; r++) {
            let row = this.data[r];
            if (row.length > index) {
                colum[r] = row[index];
            }
        }
        if (colum.length == 0) {
            return null;
        }
        return colum;
    }
    /**
     * 获取某一列的数据
     * @param index
     */
    getColumValue(index) {
        let colum = this.getColumn(index);
        if (colum) {
            return colum.map(a => a ? a.value : null);
        }
        else {
            return null;
        }
    }
    /**
     * 获取单元行数据
     * @param row 行编号
     * @param colum 列编号
     */
    getValue(row, colum) {
        let r = this.data[row];
        let c = null;
        if (r) {
            c = r[colum];
        }
        return c && c.value;
    }
    /**
     * 设置单元数据
     * @param row 行编号
     * @param colum 列编号
     */
    setValue(row, colum, value) {
        let r = this.data[row];
        if (r == null) {
            r = this.data[row] = []; //创建新的行
        }
        let c = r[colum];
        if (c == null) {
            c = r[colum] = new Cell_1.Cell; //创建新的单元
        }
        c.value = value;
    }
    setColor(row, colum, color) {
        let r = this.data[row];
        if (r == null) {
            r = this.data[row] = []; //创建新的行
        }
        let c = r[colum];
        if (c == null) {
            c = r[colum] = new Cell_1.Cell; //创建新的单元
        }
        c.color = color;
    }
    setBackground(row, colum, color) {
        let r = this.data[row];
        if (r == null) {
            r = this.data[row] = []; //创建新的行
        }
        let c = r[colum];
        if (c == null) {
            c = r[colum] = new Cell_1.Cell; //创建新的单元
        }
        c.background = color;
    }
    setDescribe(row, colum, describe) {
        let r = this.data[row];
        if (r == null) {
            r = this.data[row] = []; //创建新的行
        }
        let c = r[colum];
        if (c == null) {
            c = r[colum] = new Cell_1.Cell; //创建新的单元
        }
        c.describe = describe;
    }
    get xlsxData() {
        const workSheet = {};
        const range = { s: { c: 1e7, r: 1e7 }, e: { c: 0, r: 0 } };
        for (let R = 0; R !== this.data.length; R += 1) {
            for (let C = 0; C !== this.data[R].length; C += 1) {
                if (range.s.r > R)
                    range.s.r = R;
                if (range.s.c > C)
                    range.s.c = C;
                if (range.e.r < R)
                    range.e.r = R;
                if (range.e.c < C)
                    range.e.c = C;
                if (this.data[R][C] == null) {
                    continue; // eslint-disable-line
                }
                let c = this.data[R][C];
                if (c.value == undefined) {
                    continue;
                }
                const cell = { v: c.value };
                const cellRef = xlsx.utils.encode_cell({ c: C, r: R });
                if (isNumber(cell.v)) {
                    cell.t = 'n';
                }
                else if (isBoolean(cell.v)) {
                    cell.t = 'b';
                }
                else if (cell.v instanceof Date) {
                    cell.t = 'n';
                    cell.v = buildExcelDate(cell.v);
                    cell.z = cell.z || xlsx.SSF._table[14]; // eslint-disable-line no-underscore-dangle
                    /* eslint-disable spaced-comment, no-trailing-spaces */
                    /***
                     * Allows for an non-abstracted representation of the data
                     *
                     * example: {t:'n', z:10, f:'=AVERAGE(A:A)'}
                     *
                     * Documentation:
                     * - Cell Object: https://sheetjs.gitbooks.io/docs/#cell-object
                     * - Data Types: https://sheetjs.gitbooks.io/docs/#data-types
                     * - Format: https://sheetjs.gitbooks.io/docs/#number-formats
                     **/
                    /* eslint-disable spaced-comment, no-trailing-spaces */
                }
                else if (isObject(cell.v)) {
                    cell.t = cell.v.t;
                    cell.f = cell.v.f;
                    cell.z = cell.v.z;
                }
                else {
                    cell.t = 's';
                }
                if (isNumber(cell.z))
                    cell.z = xlsx.SSF._table[cell.z]; // eslint-disable-line no-underscore-dangle
                //教程 https://www.jianshu.com/p/50d3bc9813e3
                if (c.background) {
                    cell.s = cell.s || {};
                    cell.s.fill = {
                        fgColor: { rgb: c.background }
                    };
                }
                if (c.color) {
                    cell.s = cell.s || {};
                    cell.s.font = {
                        color: { rgb: c.color }
                    };
                }
                if (c.describe) {
                    if (!cell.c)
                        cell.c = [];
                    cell.c.push({ a: "glee", t: c.describe });
                    cell.c.hidden = true;
                }
                workSheet[cellRef] = cell;
            }
        }
        if (range.s.c < 1e7) {
            workSheet['!ref'] = xlsx.utils.encode_range(range);
        }
        // if (options['!cols']) {
        //   workSheet['!cols'] = options['!cols'];
        // }
        // if (options['!merges']) {
        //   workSheet['!merges'] = options['!merges'];
        // }
        return workSheet;
    }
}
exports.Sheet = Sheet;
//# sourceMappingURL=Sheet.js.map