
/**
 * 标准模板文本
 * @param s 
 * @returns 
 */
export function stdtemp(s: string): string {
	return s
}

/**
 * 注释
 * @param a 
 * @returns 
 */
export function cmm(a?: string) { return "" }
/**
 * 表达式
 * @param f 
 * @returns 
 */
export function st(f: (a?: any) => string) {
	return f()
}
/**
 * 遍历列表生成字符串
 * - 会自动去除头尾多余的换行符(LF)
 * @param ls 
 * @param f 
 * @returns 
 */
export function foreach<T>(ls: T[], f: (e: T) => string, sign: string = "\n", autoTrim = true) {
	let line = ls.map(e => {
		let sl = f(e)
		if (autoTrim) {
			if (sl.startsWith("\n")) {
				sl = sl.substring(1)
			}
			if (sl.endsWith("\n")) {
				sl = sl.substring(0, sl.length - 1)
			}
		}
		return sl
	}).join(sign)
	return line
}

export class Cond {
	protected lines: string[] = []
	protected finished: boolean = false
	iff(cond: boolean, call: (cond: Cond) => string) {
		if (this.finished) {
			return
		}
		if (cond) {
			this.finished = true
			let str = call(this)
			this.lines.push(str)
		}
		return this
	}

	elseif(cond: boolean, call: (cond: Cond) => string) {
		if (this.finished) {
			return
		}
		if (cond) {
			this.finished = true
			let str = call(this)
			this.lines.push(str)
		}
		return this
	}

	else(call: (cond: Cond) => string) {
		if (this.finished) {
			return
		}
		this.finished = true
		let str = call(this)
		this.lines.push(str)
		return this
	}

	toString() {
		return this.lines.map(l => {
			if (l.startsWith("\n")) {
				l = l.substring(1)
			}
			if (l.endsWith("\n")) {
				l = l.substring(0, l.length - 1)
			}
			return l
		}).join("")
	}
}

export function iff(cond: boolean, call: (cond: Cond) => string): Cond
export function iff(cond: any, call: (cond: Cond) => string): Cond
export function iff(cond: boolean, call: (cond: Cond) => string) {
	return new Cond().iff(cond, call)
}

/**
 * 首字母大写
 * @param str 
 * @returns 
 */
export function makeFirstLetterUpper(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
/**
 * 首字母小写
 * @param str 
 * @returns 
 */
export function makeFirstLetterLower(str: string) {
	return str.charAt(0).toLowerCase() + str.slice(1);
}

export function clearSpace(value: string) {
	return value.replace(/^(\r|\n|\t| )+$/gm, "");
}
