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
        .array("tags").alias("t", "tags").describe("tag", "导出单张表格的模板")
        .array("inject").describe("inject", "注入到模板中的boolean形变量，可以间接控制模板功能")
        .string("packagename").describe("packagename", "包名称")
        .boolean("tableNameFirstLetterUpper").describe("tableNameFirstLetterUpper", "talbe首字母大写")
        .demandOption(["from", "to"])
        .array("libs").describe("external npm modules path", "扩展npm模块路径")
        .array("scenes").describe("export scene", "导出场景")
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
function tryImport(str) {
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
    let inject = argv.inject || [];
    let packagename = argv.packagename;
    let tableNameFirstLetterUpper = argv.tableNameFirstLetterUpper;
    let libs = argv.libs || [];
    let scenes = argv.scenes || [];
    let injectMap = {};
    for (let k of inject) {
        injectMap[k] = true;
    }
    //加载所有表格数据
    let workbookManager = new WorkbookManager_1.WorkbookManager();
    // 暂时只需要支持一个
    workbookManager.meta.scenes = scenes.concat();
    await workbookManager.build(from); //加载所有表
    const runExport = (scene, needInjectSceneFolder) => {
        let to = toRoot;
        if (scene) {
            if (needInjectSceneFolder) {
                to = (0, path_1.join)(toRoot, scene);
            }
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
        for (let psc of pscs) {
            let ps = psc.split(":");
            let tag = ps[1];
            let pluginName = ps[0];
            let pluginFullName = "export-table-pulgin-" + pluginName;
            let plugin;
            {
                plugin = tryImport(pluginFullName);
                if (plugin == ImportFailed) {
                    for (let lib of libs) {
                        plugin = tryImport((0, path_1.join)(lib, pluginFullName));
                        if (plugin != ImportFailed) {
                            break;
                        }
                    }
                }
            }
            if (plugin == ImportFailed) {
                console.error(`plugin not found: <${pluginName}>`);
                return;
            }
            let exportPlugins = plugin.ExportPlugins;
            exportPlugins = exportPlugins ?? [];
            let matchedPlugins = exportPlugins
                .filter(p => p.tags.indexOf(tag) >= 0 || tag == p.name);
            {
                //导出每张表
                console.log(`> handle sheets begin`);
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
                        };
                        matchedPlugins.forEach(plugin => {
                            console.log(`>>> - handle sheet <${table.nameOrigin}> with [${plugin.name}]`);
                            plugin.handleSheet(paras);
                        });
                    }
                }
                console.log(`> handle sheets done`);
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
                };
                console.log(`> handle batch begin`);
                matchedPlugins.forEach(plugin => {
                    console.log(`>> - handle batch with [${plugin.name}]`);
                    plugin.handleBatch(paras);
                });
                console.log(`> handle batch done`);
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