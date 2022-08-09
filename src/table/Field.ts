import { DataTable } from "./DataTable";
import { FieldExtendMode, FieldMeta } from "./meta/FieldMeta";

export type FiledType = "any" | "uid" | "number" | "number[]" | "bool" | "bool[]" | "string" | "object" | "object[]" | "fk" | "string*" | "string[]" | "key" | "fk[]"
export const TypeList = ["any", "number", "number[]", "bool", "bool[]", "string", "string[]", "object", "object[]", "key"]


export class Field {
	/**
	 * 是否跳过该字段
	 */
	skip: boolean = false;
	skipOrigin: boolean = false;

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
	type: FiledType;

	/**
	 * 配置的原始类型
	 */
	rawType: string;

	/**
	 * 是否唯一
	 */
	isUnique: boolean = false

	/**
	 * 从左到右出现顺序
	 */
	indexOrigin: number = -1

	/**
	 * 从左到右出现顺序
	 */
	index: number = -1

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
	fkTable?: DataTable
	get fkTableName(): string | undefined {
		return this.fkTable?.name
	}
	/**
	 * 外键域
	 */
	fkField?: Field
	get fkFieldName(): string | undefined {
		return this.fkField?.name
	}

	//翻译
	translate: boolean = false;

	meta?: FieldMeta

	constructor(name: string, describe: string, type: FiledType, rawType: string) {
		this.nameOrigin = name;
		this.name = name
		this.describe = describe;
		this.type = type;
		this.rawType = rawType;
	}

	get isFKField() {
		return this.fkTableNameOrigin != null
	}

	applyMeta(fieldMeta: FieldMeta) {
		if (fieldMeta.exportName) {
			this.name = fieldMeta.exportName
		}

		if (fieldMeta.type) {
			this.type = fieldMeta.type
		}

		if (fieldMeta.extendMode == FieldExtendMode.Sub) {
			this.skip = true
		} else {
			this.skip = false
		}

		this.meta = fieldMeta
	}

}
