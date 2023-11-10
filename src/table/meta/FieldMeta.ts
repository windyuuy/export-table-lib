import { Field, FieldType } from "../Field"
import { CustomFieldMeta } from "./CustomFieldMeta"

/**
 * 继承模式
 */
export enum FieldExtendMode {
	Sub = "-",
	Add = "+",
}

export class FieldMeta {
	/**
	 * 导出类型
	 */
	type?: FieldType
	/**
	 * 导出名称
	 */
	exportName?: string
	/**
	 * 继承模式
	 */
	extendMode: FieldExtendMode = FieldExtendMode.Add
	name: string

	/**
	 * 自定义元信息
	 */
	customMetas: CustomFieldMeta[] = []

	addCustomMeta(s: string) {
		let metaS = s.split(" ").slice(2).join(" ")
		let meta = new CustomFieldMeta()
		meta.index = this.customMetas.length
		meta.key = metaS
		this.customMetas.push(meta)
	}

	constructor(
		/**
		 * 源名称
		 */
		public data: string,
	) {
		let m = data.match(/(?:\:(\-))?(?:([^\:\=]+)(?:\:([^\:\=]+))?\=)?([^\:\=]+)/)!
		let sign = m[1]
		let exportName = m[2]
		let type = m[3]
		let fieldName = m[4]
		this.name = fieldName
		this.exportName = exportName
		this.type = type as FieldType
		this.extendMode = sign == "-" ? FieldExtendMode.Sub : FieldExtendMode.Add
	}
}
