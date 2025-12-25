"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cond = void 0;
exports.stdtemp = stdtemp;
exports.cmm = cmm;
exports.st = st;
exports.foreach = foreach;
exports.iff = iff;
exports.makeFirstLetterUpper = makeFirstLetterUpper;
exports.makeFirstLetterLower = makeFirstLetterLower;
exports.clearSpace = clearSpace;
/**
 * 标准模板文本
 * @param s
 * @returns
 */
function stdtemp(s) {
    return s;
}
/**
 * 注释
 * @param a
 * @returns
 */
function cmm(a) { return ""; }
/**
 * 表达式
 * @param f
 * @returns
 */
function st(f) {
    return f();
}
/**
 * 遍历列表生成字符串
 * - 会自动去除头尾多余的换行符(LF)
 * @param ls
 * @param f
 * @returns
 */
function foreach(ls, f, sign = "\n", autoTrim = true) {
    let line = ls.map(e => {
        let sl = f(e);
        if (autoTrim) {
            if (sl.startsWith("\n")) {
                sl = sl.substring(1);
            }
            if (sl.endsWith("\n")) {
                sl = sl.substring(0, sl.length - 1);
            }
        }
        return sl;
    }).filter(line => line != "").join(sign);
    return line;
}
class Cond {
    lines = [];
    finished = false;
    iff(cond, call) {
        if (this.finished) {
            return this;
        }
        if (cond) {
            this.finished = true;
            let str = call(this);
            this.lines.push(str);
        }
        return this;
    }
    elseif(cond, call) {
        if (this.finished) {
            return this;
        }
        if (cond) {
            this.finished = true;
            let str = call(this);
            this.lines.push(str);
        }
        return this;
    }
    else(call) {
        if (this.finished) {
            return this;
        }
        this.finished = true;
        let str = call(this);
        this.lines.push(str);
        return this;
    }
    toString() {
        return this.lines.map(l => {
            if (l.startsWith("\n")) {
                l = l.substring(1);
            }
            if (l.endsWith("\n")) {
                l = l.substring(0, l.length - 1);
            }
            return l;
        }).join("");
    }
}
exports.Cond = Cond;
function iff(cond, call) {
    return new Cond().iff(cond, call);
}
/**
 * 首字母大写
 * @param str
 * @returns
 */
function makeFirstLetterUpper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * 首字母小写
 * @param str
 * @returns
 */
function makeFirstLetterLower(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}
function clearSpace(value) {
    return value.replace(/^(\r|\n|\t| )+$/gm, "");
}
//# sourceMappingURL=Utils.js.map