import { Sheet } from "./Sheet";
import { WorkbookManager } from "./WorkbookManager";
import chalk from "chalk";
import { Cell } from "./Cell";
import { Field, FieldType, TypeList } from "./Field";
import { SheetExtendMode, SheetMeta } from "./meta/SheetMeta";

/**
 * 严格检查是否整形, 而非浮点型, 并转换出整形
 * @param n 
 * @returns 
 */
export const strictParseInt = (n: any) => {
    var fn = parseFloat(n);
    if (isNaN(fn)) {
        return parseInt(n)
    } else {
        var ln = parseInt(n)
        if (fn != ln) {
            return NaN
        } else {
            return ln
        }
    }
}

const toTypeValue = (v: any, t: FieldType) => {
    if (typeof (v) != t) {
        if (t == "string" || t == "key" || t == "string*") {
            return `${v}`
        } else if (t == "number" || t == "float" || t == "uid") {
            return parseFloat(v)
        } else if (t == "int" || t == "long") {
            return strictParseInt(v)
        } else if (t == "bool") {
            return !!v
        } else {
            return v
        }
    } else {
        return v;
    }
}

/**
 * 专门处理普通数据表,可设定字段类型，添加移除对象等功能
 */
export class DataTable {

    manager:WorkbookManager|null=null;

    /**
     * 工作簿名
     */
    get workbookName(): string {
        return this.sheet.workbookName
    }

    get fullName() {
        return this.sheet.fullName
    }

    get index() {
        return this.sheet.index
    }

    name: string
    constructor(
        /**
         * 当前操作的数据页
         */
        public sheet:Sheet,

        /**
         * 表名
         */
        public nameOrigin: string
        ){
        this.name = nameOrigin
    }

    applyMeta(meta: SheetMeta) {
        this.sheet.applyMeta(meta)
        if (meta.exportSheetName) {
            this.name = meta.exportSheetName
        }
        if (meta.extendMode == SheetExtendMode.Sub) {
            for (let field of this.fields ?? []) {
                field.skip = true
            }
        } else {
            for (let field of this.fields ?? []) {
                field.skip = field.skipOrigin
            }
        }
        this.updateFieldsOrder()

        meta.fieldMetas.forEach((fieldMeta) => {
            let field = this.getField(fieldMeta.name)
            if (field != null) {
                field.applyMeta(fieldMeta)
            } else {
                console.warn(chalk.yellow(`apply field meta for invalid field: ${fieldMeta.name}`))
            }
        })

    }

    updateFieldsOrder() {
        let fieldIndex = 0
        for (let field of this.fields ?? []) {
            if (!field.skip) {
                // field.index
                field.index = fieldIndex
                fieldIndex++
            }
        }
    }

    isNullCell(cell:Cell|null){
        if(cell==null || cell.value==null || String(cell.value).trim()==""){
            return true;
        }
        return false;
    }

    protected getFields(): Field[] | null {
        let fieldList = [];
        for (let i = 0; i < this.sheet.data[1].length; i++) {
            //第一行 注释
            //第二行 字段名
            //第三行 字段类型
            if (this.isNullCell(this.sheet.data[0][i]) &&
                this.isNullCell(this.sheet.data[1][i]) &&
                this.isNullCell(this.sheet.data[2][i])) {
                break;//结束
            }


            let des: string = String(this.sheet.data[0][i].value || "").trim()
            let name: string = String(this.sheet.data[1][i].value || "").trim()
            let rawType: string = String(this.sheet.data[2][i].value || "").trim()
            let type = rawType
            let fkTableName: string | undefined
            let fkFieldName: string | undefined
            let translate: boolean = false;

            if (type === "") {
                let skip = new Field(name || des, des || name, "any", rawType);
                skip.skip = true;
                skip.skipOrigin = true;
                skip.index = i
                skip.indexOrigin = i
                fieldList.push(skip)
                continue;
            }

            let isUnique = false
            let typeList = TypeList
            if (typeList.indexOf(type.toLowerCase()) != -1) {
                //常规类型
            } else if(type.startsWith("@")) {
                // extend custom type outside, like @(int,number)[]
                type = "string"
            } else if (type.substr(0, 4).toLocaleLowerCase() == "fk[]") {//外键数组
                //外键数组
                let param = type.split(/\s+/)
                if (param.length < 3) {
                    console.error(chalk.red(`表外键 ${type} 配置错误`))
                    return null;
                }

                fkTableName = param[1]
                fkFieldName = param[2]
                type = "fk[]"
            } else if (type.substr(0, 2).toLowerCase() == "fk") {
                //外键
                let param = type.split(/\s+/)
                if (param.length < 3) {
                    console.error(chalk.red(`表外键 ${type} 配置错误`))
                    return null;
                }

                fkTableName = param[1]
                fkFieldName = param[2]
                type = "fk"
            } else if (type == "string*") {
                type = "string"
                translate = true;
            } else if (type.substr(0, 3).toLowerCase() == "uid") {
                let param = type.split(/\s+/)
                if (param.length < 2) {
                    type = "uid"
                } else {
                    let utype = param[1]
                    if (typeList.indexOf(utype.toLowerCase()) <= 0) {
                        console.error(chalk.red(`唯一key ${type} 配置错误`))
                        return null;
                    }
                    type = utype
                }
                isUnique = true
            } else {
                //不支持的类型
                type = "any"
            }
            let field = new Field(name, des, type.toLocaleLowerCase() as any, rawType)
            field.isUnique = isUnique
            field.fkTableNameOrigin = fkTableName
            field.fkFieldNameOrigin = fkFieldName
            if (field.fkTableNameOrigin !== undefined) {
                let fkTable = this.getTableByFK(field)
                field.fkTable = fkTable
            }
            if (field.fkFieldNameOrigin !== undefined) {
                let fkField = this.getFKField(field)
                field.fkField = fkField
            }
            field.translate = translate;
            if (this.sheet.data[0][i].describe) {
                field.describe += "\n" + this.sheet.data[0][i].describe //添加备注
            }
            field.index = i
            field.indexOrigin = i

            fieldList.push(field)
        }
        return fieldList;
    }

    protected _fields: Field[] | null = null

    /**
     * 获取当前表中的字段列表
     */
    get fields(): Field[] | null {
        return this._fields ?? (this._fields = this.getFields())
    }

    get activeFields(): Field[] | null {
        return this.fields?.filter(f => f.skip == false) ?? null
    }

    
    protected getNewData(field:Field,data:any,lineNumber:number):any{
        if(field.type=="any"){
            //any不做任何处理
            return data
        }else if(field.type=="uid"){
            let newValue = parseFloat(data);
            if(isNaN(newValue)){
                newValue=0;
                console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> ${field.type}类型值填写错误 ${data}`))
            }
            return newValue;
        } else if (field.type == "number" || field.type == "float") {
            if(data==undefined || data==="")
                data=0;
            let newValue= parseFloat(data);
            if(isNaN(newValue)){
                newValue=0;
                console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> ${field.type}类型值填写错误 ${data}`))
            }
            return newValue;
        } else if (field.type == "int" || field.type == "long") {
            if (data == undefined || data === "")
                data = 0;
            let newValue = strictParseInt(data);
            if (isNaN(newValue)) {
                newValue = 0;
                console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> ${field.type}类型值填写错误 ${data}`))
            }
            return newValue;
        } else if (field.type == "number[]" || field.type == "float[]") {
            if(data==undefined || data==="" || data=="[]")
                data=null;

            if(typeof data=="number"){
                return [data];
            }else if(typeof data=="string"){
                data=data.replace(/\[|\]/g,"");
                let list=data.split(/,|;/)
                let result=[]
                for(let i=0;i<list.length;i++){
                    let v=parseFloat(list[i])
                    if(isNaN(v)){
                        v=0
                        console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> ${field.type}类型值填写错误 ${data}`))
                    }
                    result.push(v)
                }
                return result;
            }else{
                return [];
            }
        } else if (field.type == "int[]" || field.type == "long[]") {
            if (data == undefined || data === "" || data == "[]")
                data = null;

            if (typeof data == "number") {
                return [data];
            } else if (typeof data == "string") {
                data = data.replace(/\[|\]/g, "");
                let list = data.split(/,|;/)
                let result = []
                for (let i = 0; i < list.length; i++) {
                    let v = strictParseInt(list[i])
                    if (isNaN(v)) {
                        v = 0
                        console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> ${field.type}类型值填写错误 ${data}`))
                    }
                    result.push(v)
                }
                return result;
            } else {
                return [];
            }
        }else if(field.type=="bool"){
            if(data==undefined || data==="")
                data=false;

            if(typeof data =="boolean"){
                return data
            }else if(String(data).toLowerCase()=="false" || String(data)=="0"){
                return false;
            }else if(String(data).toLowerCase()=="true" || String(data)=="1"){
                return true;
            }else{
                return Boolean(data);
            }
        }else if(field.type=="bool[]"){
            if(data==undefined || data=="" || data=="[]")
                data=null;

            if(typeof data=="boolean"){
                return [data];
            }else if(typeof data=="string"){
                data=data.replace(/\[|\]/g,"");
                let list=data.split(/,|;/)
                let result=[]
                for(let i=0;i<list.length;i++){
                    let v=list[i]
                    if(v.toLowerCase()=="false" || v=="0"){
                        result.push(false);
                    }else if(v.toLowerCase()=="true" || v=="1"){
                        result.push(true);
                    }else{
                        result.push(Boolean(data))
                    }
                }
                return result;
            }else{
                return []
            }
        }else if(field.type=="string"){
            if(data==null){
                return ""
            }
            return String(data);
        }else if(field.type=="string[]"){
            if(data==null){
                data = ""
            }
            if(data==undefined || data=="" || data=="[]")
                data=null;

            if(typeof data=="string"){
                //使用,,分割字符串
                return data.split(/,,|;;/g);
            }else if(typeof data=="number"){
                return [data.toString()];
            }else if(data==null){
                return [];
            }else{
                console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> string[]类型值填写错误 ${data}`))
                return []
            }

        }else if(field.type=="string*"){
            if(data==null){
                return ""
            }
            return String(data);
        }else if(field.type=="object"){
            try{
                let json=eval("(function(){return "+String(data)+"})()");
                return json;
            }catch(e){
                console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> object类型值填写错误 ${data}`))
                return String(data)
            }
        }else if(field.type=="object[]"){
            try{
                let json=eval("(function(){return "+String(data)+"})()");
                if(json==null){
                    return []
                }
                if(json instanceof Array==false){
                    return [json]
                }
                return json;
            }catch(e){
                console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> object[]类型值填写错误 ${data}`))
                return []
            }
        }else if(field.type=="fk"){
            if (data === null || data === undefined || data === "" || data == "undefined") {
                data = -1;
            } else {
                var fkType = this.getFKField(field)?.type;
                if (fkType == "number" || fkType == "float") {
                    if (isNaN(parseFloat(data))) {
                        console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> fk${fkType}类型值填写错误 ${data}`))
                    }
                } else if (fkType == "int" || fkType == "long") {
                    if (isNaN(strictParseInt(data))) {
                        console.error(chalk.red(`表${this.fullName} 行${lineNumber} 字段<${field.nameOrigin}> fk${fkType}类型值填写错误 ${data}`))
                    }
                }
            }
            return data
        }else if(field.type=="key"){
            if(data==null){
                return ""
            }
            return String(data);
        }else if(field.type=="fk[]"){
            if(data==undefined || data==="" || data=="[]")
                data=null;
            if(typeof data=="number"){
                return [data];
            }else if(typeof data=="string"){
                data=data.replace(/\[|\]/g,"");
                let list=data.split(/,|;/)
                let result=[]
                for (let i = 0; i < list.length; i++) {
                    let v: any
                    // if (isNaN(list[i])) {
                    v = list[i]
                    // } else {
                    //     let vn = parseFloat(list[i])
                    //     if (isNaN(vn)) {
                    //         vn = 0
                    //         console.error(chalk.red(`表${this.name} 行${lineNumber} 字段<${field.name}> number[]类型值填写错误 ${data}`))
                    //     }
                    //     v = vn
                    // }

                    result.push(v)
                }
                return result;
            }else{
                return [];
            }
        }
    }

    protected _dataList: any[][] | undefined
    public get dataList(): any[][] {
        return this._dataList ?? (this._dataList = this.getDataList())
    }

    /**
     * 获取所有的数据列表
     */
    getDataList(){
        let fieldList=this.fields;
        if(!fieldList)
            return [];

        let data=[];
        for(let i=3;i<this.sheet.data.length;i++){
            let line=[];
            let lineData=this.sheet.data[i];
            if(!lineData || lineData[0].value==null){
                continue;
            }
            for(let l=0;l<fieldList.length;l++){
                let data=lineData[l]
                let field=fieldList[l];
                if (field && field.skip == false) {
                    let v = this.getNewData(field, data && data.value, i + 1)
                    line.push(v);
                }
            }
            data.push(line)
        }
        return data;
    }

    convDataToObject(data: any[], fieldList: Field[]): any {
        let obj: any = {}
        for (let i = 0; i < fieldList.length; i++) {
            let f = fieldList[i];
            obj[f.name] = data[i];
        }
        return obj
    }

    /**
     * 获取经过转换的对象
     */
    getObjectList(){
        let fieldList=this.fields;
        if(!fieldList)
            return [];
        
        fieldList = fieldList.filter(a => a.skip == false);
        let dataList=this.getDataList();

        let objList:any[]=[]
        for(let data of dataList){
            let obj: any = this.convDataToObject(data, fieldList)
            objList.push(obj);
        }

        return objList;
    }

    getRowData(key: any, field: Field) {
        let fieldIndex = field.indexOrigin
        let realKey = toTypeValue(key, field.type)
        let data = this.dataList.find(d => d[fieldIndex] == realKey)
        return data
    }

    /**
     * 获取字段元信息
     * @param name 
     * @returns 
     */
    getField(name: string) {
        let field = this.fields?.find(f => f.nameOrigin == name)
        return field
    }

    getTableByFK(field: Field) {
        let fkKey = field.fkTableNameOrigin as string
        let tableName: string
        let workbookName: string
        if (fkKey.indexOf(":") <= 0) {
            tableName = fkKey
            workbookName = this.workbookName
        } else {
            let lines = fkKey.split(":")
            workbookName = lines[0]
            tableName = lines[1]
        }
        let fkTable = this.manager!.getTableByName(tableName, workbookName)!
        return fkTable
    }

    /**
     * 获取外键字段元信息
     * @param field 
     * @returns 
     */
    getFKField(field: Field) {
        let fkTable = this.getTableByFK(field)
        if (field.fkFieldNameOrigin && fkTable != null) {
            let fkField = fkTable.getField(field.fkFieldNameOrigin)
            return fkField
        }
        return undefined
    }

    getFKObject<T = any>(fkRefer: any, field: Field): T | undefined {
        let data = this.getFKData(fkRefer, field)
        if (data !== undefined) {
            if (field.type == "fk") {
                let fkTable = this.getTableByFK(field)!
                let obj = this.convDataToObject(data, fkTable.fields!)
                return obj
            } else if (field.type == "fk[]") {
                let fkTable = this.getTableByFK(field)!
                let objs = (data as any[][]).map(d => this.convDataToObject(d, fkTable.fields!))
                return objs as any as T
            } else {
                throw new Error("unknown case")
            }
        }
        return undefined
    }

    getFKData<T = any[]>(fkRefer: any, field: Field): T | undefined {
        if (field.type == "fk") {
            //外键检查
            let fkTable = this.getTableByFK(field);
            if (fkTable == null) {
                console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键表GA ${field.fkTableNameOrigin}`))
                return undefined
            }
            let fkField = fkTable.getField(field.fkFieldNameOrigin!)!
            if (fkField == null) {
                console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键GA ${field.fkTableNameOrigin}:${field.fkFieldNameOrigin}`))
                return undefined
            }
            let fkData = fkTable.getRowData(fkRefer, fkField)
            return fkData as any as T
        } else if (field.type == "fk[]") {
            //外键数组
            let fkTable = this.getTableByFK(field);
            if (fkTable == null) {
                console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键表[]GA ${field.fkTableNameOrigin}`))
                return undefined
            }
            let fkField = fkTable.getField(field.fkFieldNameOrigin!)!
            if (fkField == null) {
                console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键[]GA ${field.fkTableNameOrigin}:${field.fkFieldNameOrigin}`))
                return undefined
            }
            let fkDatas = (fkRefer as any[]).map(fkR => {
                let fkData = fkTable!.getRowData(fkR, fkField)
                return fkData
            })
            return fkDatas as any as T
        } else {
            return undefined
        }
    }

    
    /** 
     * 检查表格格式是否错误
    */
    checkError(){
        let fieldList=this.fields;
        let data=this.getDataList();
        if(fieldList==null){
            return;
        }
        fieldList=fieldList.filter(a=>a.skip==false)
        //检查 uid 和 fk
        for(let i=0;i<fieldList.length;i++){
            let field = fieldList[i];

            if (field.isUnique) {
                //唯一ID 检查
                let map = new Map()
                for (let j = 0; j < data.length; j++) {
                    let line = data[j]
                    let v = JSON.stringify(line[i]);//找到相应的值
                    if (map.has(v)) {
                        console.error(chalk.red(`表${this.fullName} 行${j + 4} 字段<${field.nameOrigin}> 出现重复值 ${v}`))
                    }
                    map.set(v, true);
                }
            } else if (field.type == "fk") {
                //外键检查
                let fkTable = this.getTableByFK(field);
                if(fkTable==null){
                    console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键表EB ${field.fkTableNameOrigin}`))
                    continue;
                }
                let fkField = fkTable.fields?.find(f => f.nameOrigin == field.fkFieldNameOrigin)!
                if (fkField == null) {
                    console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键EB ${field.fkTableNameOrigin}:${field.fkFieldNameOrigin}`))
                    continue;
                }
                let list = fkTable.getFieldValueList(field.fkFieldNameOrigin as string)
                for(let j=0;j<data.length;j++){
                    let line=data[j]
                    let v = toTypeValue(line[i], fkField.type);//找到相应的值

                    if(v && v!=-1 && list.indexOf(v)==-1){//只有明确的值才检查
                        console.error(chalk.red(`表${this.fullName} 行${j + 4} 字段<${field.nameOrigin}> 无法找到外键值 ${v}`))
                    }
                }
            }else if(field.type=="fk[]"){
                //外键数组
                let fkTable = this.getTableByFK(field);
                if(fkTable==null){
                    console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键表[]EB ${field.fkTableNameOrigin}`))
                    continue;
                }
                let fkField = fkTable.fields?.find(f => f.nameOrigin == field.fkFieldNameOrigin)!
                if (fkField == null) {
                    console.error(chalk.red(`表${this.fullName} 字段<${field.nameOrigin}> 无法找到外键[]EB ${field.fkTableNameOrigin}:${field.fkFieldNameOrigin}`))
                    continue;
                }
                let list = fkTable.getFieldValueList(field.fkFieldNameOrigin as string)
                for (let j = 0; j < data.length; j++) {
                    let line=data[j]
                    let v = line[i];//找到相应的值

                    if (v) {
                        for (let i = 0; i < v.length; i++) {
                            let vi = toTypeValue(v[i], fkField.type)
                            if (list.indexOf(vi) == -1) {
                                console.error(chalk.red(`表${this.fullName} 行${j + 4} 字段<${field.nameOrigin}> 无法找到外键值[] ${v[i]}`))
                            }
                        }
                    }

                }
            }
        }
    }

    /**
     * 获取指定字段的值列表
     * @param fieldName 字段名称 
     */
    getFieldValueList(fieldName:string):any[]{
        let result=[];
        let data=this.getDataList();
        let fieldList=this.fields!.filter(a=>a.skip==false)
        for(let i=0;i<fieldList.length;i++){
            if (fieldList[i].nameOrigin == fieldName) {
                for(let j=0;j<data.length;j++){
                    let line=data[j]
                    result.push(line[i])
                }
                break;
            }
        }

        return result;
    }
}
