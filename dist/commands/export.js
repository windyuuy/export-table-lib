"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.builder = exports.describe = exports.command = void 0;
const WorkbookManager_1 = require("../table/WorkbookManager");
const xxtea = require("xxtea-node");
const pako = require("pako");
const path_1 = require("path");
const OutFilePath_1 = require("../iplugin/OutFilePath");
const chalk_1 = require("chalk");
exports.command = 'export <from> <to>';
exports.describe = '导出表格，可以每张表格单独导出，或是全部数据一起导出。';
function builder(yargs) {
    return yargs
        .string("from")
        .string("to")
        .string("namespace").describe("namespace", "命名空间").default("namespace", "MEEC.ExportedConfigs")
        .array("tagoutpaths").describe("tagoutpaths", "各tag对应路径")
        .array("tags").alias("t", "tags").describe("tag", "导出单张表格的模板")
        .array("inject").describe("inject", "注入到模板中的boolean形变量，可以间接控制模板功能")
        .string("packagename").describe("packagename", "包名称")
        .boolean("tableNameFirstLetterUpper").describe("tableNameFirstLetterUpper", "talbe首字母大写")
        .boolean("verbose")
        .demandOption(["from", "to"])
        .array("libs").describe("external npm modules path", "扩展npm模块路径").alias("l", "libs")
        .array("scenes").describe("export scene", "导出场景")
        .boolean("recursive").alias("r", "recursive")
        .help("h");
}
exports.builder = builder;
function encrypt(str, key, deflate) {
    //先压缩再加密
    if (deflate) {
        let deflateValue = pako.deflate(str);
        return xxtea.encryptToString(deflateValue, key);
    }
    else {
        return xxtea.encryptToString(str, key);
    }
}
function firstLetterUpper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
;
let ImportFailed = Symbol("FailedImport");
function tryImport(str, verbose) {
    try {
        return require(str);
    }
    catch (e) {
        // console.error(chalk.red(`${e}`))
    }
    return ImportFailed;
}
async function handler(argv) {
    let from = argv.from;
    let toRoot = argv.to;
    let tags = argv.tags;
    let tagoutpaths = argv.tagoutpaths;
    let inject = argv.inject || [];
    let packagename = argv.packagename;
    let tableNameFirstLetterUpper = argv.tableNameFirstLetterUpper;
    let libs = argv.libs || [];
    let scenes = argv.scenes || [];
    let verbose = argv.verbose ?? false;
    let recursive = argv.recursive ?? false;
    let moreOptions = argv.moreOptions ?? process.argv;
    let exportNamespace = argv.namespace;
    let injectMap = {};
    for (let k of inject) {
        injectMap[k] = true;
    }
    //加载所有表格数据
    let workbookManager = new WorkbookManager_1.WorkbookManager();
    // 暂时只需要支持一个
    workbookManager.meta.scenes = scenes.concat();
    let tLoad1 = Date.now();
    await workbookManager.build(from, recursive); //加载所有表
    let tLoad2 = Date.now();
    console.log(`load workbook timecost: ${tLoad2 - tLoad1}`);
    const getToRoot = (toRoot, scene, needInjectSceneFolder) => {
        let to = toRoot;
        if (scene) {
            if (needInjectSceneFolder) {
                to = (0, path_1.join)(toRoot, scene);
            }
        }
        return to;
    };
    const runExport = (scene, needInjectSceneFolder) => {
        // let to = toRoot
        // if (scene) {
        //     if (needInjectSceneFolder) {
        //         to = join(toRoot, scene)
        //     }
        // }
        let to = getToRoot(toRoot, scene, needInjectSceneFolder);
        if (scene) {
            // 应用场景配置
            workbookManager.applySceneConfig(scene);
        }
        workbookManager.checkError();
        let allTags = tags ? tags.join(";") : "";
        let pscs = allTags.split(";").filter(t => !!t);
        if (pscs.length <= 0) {
            console.error(chalk_1.default.red("no tag of plugins to run with !!"));
            return;
        }
        // for (let psc of pscs) {
        for (let i = 0; i < pscs.length; i++) {
            let psc = pscs[i];
            let ps = psc.split(":");
            let tag = ps[1];
            if (tagoutpaths != null && tagoutpaths.length > i) {
                let tagOutPath = tagoutpaths[i];
                to = getToRoot(tagOutPath, scene, needInjectSceneFolder);
            }
            let pluginName = ps[0];
            let pluginFullName = "export-table-pulgin-" + pluginName;
            let plugin = ImportFailed;
            {
                if (libs.length > 0) {
                    for (let lib of libs) {
                        plugin = tryImport((0, path_1.join)(lib, pluginFullName), verbose);
                        if (plugin != ImportFailed) {
                            console.log(`using local plugin ${lib}/:${pluginFullName}`);
                            break;
                        }
                    }
                }
                if (plugin == ImportFailed) {
                    plugin = tryImport(pluginFullName, verbose);
                    if (plugin != ImportFailed) {
                        console.log(`using global plugin ${pluginFullName}`);
                    }
                }
            }
            if (plugin == ImportFailed) {
                console.error(chalk_1.default.red(`plugin not found: <${pluginName}>`));
                console.error("请确认插件目录名是否以 export-table-pulgin-${PluginName} 的格式命名");
                return;
            }
            let exportPlugins = plugin.ExportPlugins;
            exportPlugins = exportPlugins ?? [];
            let matchedPlugins = exportPlugins
                .filter(p => p.tags.indexOf(tag) >= 0 || tag == p.name);
            {
                //导出每张表
                console.log(`> handle sheets begin`);
                let t1 = Date.now();
                let tables = workbookManager.dataTables;
                for (let table of tables) {
                    if (tableNameFirstLetterUpper) {
                        table.name = firstLetterUpper(table.name);
                    }
                    if (matchedPlugins.length > 0) {
                        console.log(`>> handle sheet ${table.nameOrigin}:`);
                        let paras = {
                            name: table.name,
                            tables: tables,
                            table,
                            workbookManager,
                            fields: table.activeFields,
                            datas: table.getDataList(),
                            objects: table.getObjectList(),
                            xxtea: encrypt,
                            inject: injectMap,
                            packagename: packagename,
                            outPath: to,
                            outFilePath: new OutFilePath_1.OutFilePath(to, table.fullName, "." + tag),
                            exportNamespace: exportNamespace,
                            moreOptions,
                        };
                        matchedPlugins.forEach(plugin => {
                            console.log(`>>> - handle sheet <${table.nameOrigin}> with [${plugin.name}]`);
                            let t1_1 = Date.now();
                            plugin.handleSheet(paras);
                            let t2_1 = Date.now();
                            console.log(`>>> - handle sheet <${table.nameOrigin}> with [${plugin.name}] done, timecost: ${t2_1 - t1_1}`);
                        });
                    }
                }
                let t2 = Date.now();
                console.log(`> handle sheets done, timecost: ${t2 - t1}`);
            }
            {
                let tables = workbookManager.dataTables;
                let paras = {
                    workbookManager: workbookManager,
                    tables,
                    xxtea: encrypt,
                    inject: injectMap,
                    packagename: packagename,
                    outPath: to,
                    exportNamespace: exportNamespace,
                    moreOptions,
                };
                console.log(`> handle batch begin`);
                let t1 = Date.now();
                matchedPlugins.forEach(plugin => {
                    console.log(`>> - handle batch with [${plugin.name}]`);
                    let t1_1 = Date.now();
                    plugin.handleBatch(paras);
                    let t2_1 = Date.now();
                    console.log(`>> - handle batch with [${plugin.name}] done, timecost: ${t2_1 - t1_1}`);
                });
                let t2 = Date.now();
                console.log(`> handle batch done, timecost: ${t2 - t1}`);
            }
        }
    };
    if (scenes.length > 0) {
        if (scenes.length == 1 && scenes[0] == "*") {
            scenes = workbookManager.collectScenes();
        }
        let needInjectSceneFolder = scenes.length > 1;
        for (let scene of scenes) {
            runExport(scene, needInjectSceneFolder);
        }
    }
    else {
        runExport(undefined);
    }
}
exports.handler = handler;
//# sourceMappingURL=export.js.map