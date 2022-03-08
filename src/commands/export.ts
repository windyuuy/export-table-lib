import { WorkbookManager } from "../table/WorkbookManager";
import * as  xxtea from 'xxtea-node';
import * as pako from "pako"
import { join } from "path";
import { IPlugin } from "../iplugin/IPlugin";
import { HandleSheetParams } from "..";
import { HandleBatchParams } from "../iplugin/HandleBatchParams";
import { OutFilePath } from "../iplugin/OutFilePath";
import chalk from "chalk";

export var command = 'export <from> <to>'
 
export var describe = '导出表格，可以每张表格单独导出，或是全部数据一起导出。' 
 
export function builder(yargs:typeof import("yargs")) {
    return yargs
        .string("from")
        .string("to")
        .array("tags").alias("t", "tags").describe("tag", "导出单张表格的模板")
        .array("inject").describe("inject", "注入到模板中的boolean形变量，可以间接控制模板功能")
        .string("packagename").describe("packagename", "包名称")
        .boolean("tableNameFirstLetterUpper").describe("tableNameFirstLetterUpper", "talbe首字母大写")
        .boolean("verbose")
        .demandOption(["from", "to"])
        .array("libs").describe("external npm modules path", "扩展npm模块路径")
        .array("scenes").describe("export scene", "导出场景")
        .help("h")
}

function encrypt(str:string,key:string,deflate:boolean){
    //先压缩再加密
    if(deflate){
        let deflateValue= pako.deflate(str);
        return xxtea.encryptToString(deflateValue,key);    
    }else{
        return xxtea.encryptToString(str,key);
    }
}

function firstLetterUpper(str:string){
    return str.charAt(0).toUpperCase()+str.slice(1);
};

let ImportFailed = Symbol("FailedImport")
function tryImport<T>(str: string, verbose: boolean): T | symbol {
    try {
        return require(str)
    } catch (e) {
        // console.error(chalk.red(`${e}`))
    }
    return ImportFailed;
}

export async function handler(argv: any) {
    let from: string = argv.from;
    let toRoot: string = argv.to;
    let tags: string[] | undefined = argv.tags;
    let inject: string[] = argv.inject || [];
    let packagename: string | undefined = argv.packagename;
    let tableNameFirstLetterUpper: boolean | false = argv.tableNameFirstLetterUpper;
    let libs: string[] = argv.libs || []
    let scenes: string[] = argv.scenes || []
    let verbose: boolean = argv.verbose ?? false

    let injectMap: { [key: string]: boolean } = {}
    for (let k of inject) {
        injectMap[k] = true;
    }

    //加载所有表格数据
    let workbookManager = new WorkbookManager();
    // 暂时只需要支持一个
    workbookManager.meta.scenes = scenes.concat()
    await workbookManager.build(from);//加载所有表

    const runExport = (scene?: string, needInjectSceneFolder?: boolean) => {
        let to = toRoot
        if (scene) {
            if (needInjectSceneFolder) {
                to = join(toRoot, scene)
            }

            // 应用场景配置
            workbookManager.applySceneConfig(scene)
        }

        workbookManager.checkError();

        let allTags = tags ? tags.join(";") : ""
        let pscs = allTags!.split(";").filter(t => !!t)
        if (pscs.length <= 0) {
            console.error(chalk.red("no tag of plugins to run with !!"))
            return
        }
        for (let psc of pscs) {
            let ps = psc!.split(":")
            let tag = ps[1]

            let pluginName = ps[0]
            let pluginFullName = "export-table-pulgin-" + pluginName
            type TPlugin = { ExportPlugins: IPlugin[] }
            let plugin: TPlugin | symbol = ImportFailed
            {
                if (libs.length > 0) {
                    for (let lib of libs) {
                        plugin = tryImport(join(lib, pluginFullName), verbose)
                        if (plugin != ImportFailed) {
                            console.log(`using local plugin ${lib}/:${pluginFullName}`)
                            break
                        }
                    }
                }
                if (plugin == ImportFailed) {
                    plugin = tryImport<TPlugin>(pluginFullName, verbose)
                    if (plugin != ImportFailed) {
                        console.log(`using global plugin ${pluginFullName}`)
                    }
                }
            }
            if (plugin == ImportFailed) {
                console.error(`plugin not found: <${pluginName}>`)
                return;
            }
            let exportPlugins: IPlugin[] = (plugin as TPlugin).ExportPlugins
            exportPlugins = exportPlugins ?? []
            let matchedPlugins = exportPlugins
                .filter(p => p.tags.indexOf(tag) >= 0 || tag == p.name)

            {

                //导出每张表
                console.log(`> handle sheets begin`)

                let tables = workbookManager.dataTables
                for (let table of tables) {
                    if (tableNameFirstLetterUpper) {
                        table.name = firstLetterUpper(table.name);
                    }
                    if (matchedPlugins.length > 0) {
                        console.log(`>> handle sheet ${table.nameOrigin}:`)
                        let paras: HandleSheetParams = {
                            name: table.name,
                            tables: tables,
                            table,
                            workbookManager,
                            fields: table.activeFields!,
                            datas: table.getDataList(),
                            objects: table.getObjectList(),
                            xxtea: encrypt,
                            inject: injectMap,
                            packagename: packagename,
                            outPath: to,
                            outFilePath: new OutFilePath(to, table.fullName, "." + tag),
                        }
                        matchedPlugins.forEach(plugin => {
                            console.log(`>>> - handle sheet <${table.nameOrigin}> with [${plugin.name}]`)
                            plugin.handleSheet(paras)
                        })
                    }
                }
                console.log(`> handle sheets done`)
            }

            {
                let tables = workbookManager.dataTables
                let paras: HandleBatchParams = {
                    workbookManager: workbookManager,
                    tables,
                    xxtea: encrypt,
                    inject: injectMap,
                    packagename: packagename,
                    outPath: to,
                }
                console.log(`> handle batch begin`)
                matchedPlugins.forEach(plugin => {
                    console.log(`>> - handle batch with [${plugin.name}]`)
                    plugin.handleBatch(paras)
                })
                console.log(`> handle batch done`)
            }
        }
    }

    if (scenes.length > 0) {
        if (scenes.length == 1 && scenes[0] == "*") {
            scenes = workbookManager.collectScenes()
        }
        let needInjectSceneFolder = scenes.length > 1
        for (let scene of scenes) {
            runExport(scene, needInjectSceneFolder)
        }
    } else {
        runExport(undefined)
    }

}