import * as fs from "fs"
import * as path from "path"
import { Workbook } from "./Workbook";
import { DataTable } from "./DataTable";
import chalk from "chalk";
import { SceneMetaManager } from "./meta/SceneMetaManager";
export class WorkbookManager {

    protected _list:Workbook[]=[];
    protected _tables: DataTable[] | null = null;
    meta: SceneMetaManager = new SceneMetaManager()

    constructor(){
    }

    applySceneConfig(scene0: string) {
        let scene = this.meta.scenes.find(s => s == scene0)
        if (scene == undefined) {
            return
        }

        let dataTables = this.dataTables
        for (let workbook of this._list) {
            let sceneMeta = workbook.metaManager.getSceneMeta(scene)
            if (sceneMeta != null) {
                sceneMeta.applyMeta(dataTables)
            }
        }
    }

    async build(buildPath: string, recursive: boolean = false) {
        
        let buildPromiseList:Promise<void>[]=[];

        if (!fs.statSync(buildPath).isDirectory()) {
            let filePath = buildPath
            //点开头的为隐藏文件
            if (path.basename(filePath)[0] == "." || path.basename(filePath)[0] == "~") {
                // skip
            } else if (path.extname(filePath) == ".xlsx") {
                //找到xls文件
                buildPromiseList.push(this.buildExcel(filePath));
            }
        } else {
            let fileList = fs.readdirSync(buildPath);
            for (let i = 0; i < fileList.length; i++) {
                let filePath = fileList[i];
                //点开头的为隐藏文件
                if (path.basename(filePath)[0] == "." || path.basename(filePath)[0] == "~") {
                    continue;
                }
                let state = fs.statSync(path.join(buildPath, filePath))
                if (state.isDirectory()) {
                    if (recursive) {
                        //继续向子目录查找
                        buildPromiseList.push(this.build(path.join(buildPath, filePath)))
                    }
                } else if (path.extname(filePath) == ".xlsx") {
                    //找到xls文件
                    buildPromiseList.push(this.buildExcel(path.join(buildPath, filePath)));
                }
            }
        }

        await Promise.all(buildPromiseList)
    }

    protected async buildExcel(excel:string){
        var promise=new Promise<void>((resolve, reject)=>{
            let t1 = Date.now();
            fs.readFile(excel, (err, buffer) => {
                let t2 = Date.now();
                if(err){
                    let t3 = Date.now();
                    console.error(chalk.red(`load excel<${excel}> failed, timecost: ${t2 - t1}, ${t3 - t2}`))
                    console.error(chalk.red(String(err)))
                    resolve();
                    return;
                }
                let workbook=new Workbook()
                workbook.load(excel,buffer)
                this._list.push(workbook);
                let t4 = Date.now();
                console.log(`load excel<${excel}> done, timecost: ${t2 - t1}, ${t4 - t2}`)
                resolve();
            });

        });
        return promise;
    }

    /**
     * 获取工作簿列表
     */
    get workbooks():Workbook[]{
        return this._list.concat();
    }

    /**
     * 获取数据列表
     */
    get dataTables():DataTable[]{
        if(this._tables==null){
            this._tables=[];
            for (let b of this._list) {
                for (let sheet of b.sheets) {
                    if (sheet && sheet.data.length >= 3) {
                        let datatable = new DataTable(sheet, sheet.nameOrigin);
                        datatable.manager = this;
                        this._tables.push(datatable);
                    }
                }
            }
    
        }
        return this._tables;
    }

    /**
     * 获取表名
     * @param name 
     */
    getTableByName(name: string, workbookName: string) {
        return this.dataTables.find(a => a.nameOrigin == name && a.workbookName == workbookName)
    }

    /**
     * 检查所有表的错误
     */
    checkError(){
        this.dataTables.forEach(a=>a.checkError());
    }

    collectScenes() {
        let scenes: string[] = []
        this.workbooks.forEach(w => {
            for (let meta of w.metaManager.sceneMetas) {
                scenes.push(meta.name)
            }
        })
        return scenes
    }

}