"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbookManager = void 0;
const fs = require("fs");
const path = require("path");
const Workbook_1 = require("./Workbook");
const DataTable_1 = require("./DataTable");
const chalk_1 = require("chalk");
const SceneMetaManager_1 = require("./meta/SceneMetaManager");
class WorkbookManager {
    _list = [];
    _tables = null;
    meta = new SceneMetaManager_1.SceneMetaManager();
    constructor() {
    }
    applySceneConfig(scene0) {
        let scene = this.meta.scenes.find(s => s == scene0);
        if (scene == undefined) {
            return;
        }
        let dataTables = this.dataTables;
        for (let workbook of this._list) {
            let sceneMeta = workbook.metaManager.getSceneMeta(scene);
            if (sceneMeta != null) {
                sceneMeta.applyMeta(dataTables);
            }
        }
    }
    async build(buildPaths, recursive = false) {
        // 先遍历 buildPaths, 每个 Item 命名 `buildPath`, 按照是否 `recursive` 决定是否递归遍历, 遍历时按照以下规则处理, 获取文件列表, 并对文件列表去重, 得到最终的文件列表 `validFileList`:
        // - 1. 如果 `buildPath` 以 `g/` 开头, 那么是 glob 表达式, 按照 glob 获取文件列表(使用 `glob` 包), 例如 `g/**/*.xlsx` 表示在当前目录及子目录下搜索所有以 `.xlsx` 结尾的文件
        // - 2. 如果 `buildPath` 以 `r/` 开头, 那么是正则表达式, 按照正则获取文件列表:
        //  - 表达式格式为 `r/<dir>?/<regex>/`，其中 `<dir>` 是要搜索的目录或文件路径，`/<regex>` 是要匹配的正则表达式(行文格式同nodejs正则表达式), 例如 `r/.?/^.*\.xlsx$/` 表示在当前目录下搜索所有以 `.xlsx` 结尾的文件
        // - 3. 否则就是普通路径, 先判断路径是文件还是目录, 再按照以下规则处理:
        //  - 以如果是文件则直接构建
        //  - 如果是目录则遍历其中的文件, 并按照 `recursive` 参数确定是否继续遍历其中的子目录
        // 再遍历 `validFileList`, 对每个文件路径调用 `buildFile` 进行构建, 加入 `buildPromiseList` 中, 最后 `await Promise.all(buildPromiseList)` 等待所有构建完成
        let validFileList = [];
        for (let buildPath of buildPaths) {
            if (buildPath.startsWith("g/")) {
                let glob = require("glob");
                let pattern = buildPath.substring(2);
                let files = glob.sync(pattern, { nodir: true });
                validFileList.push(...files);
            }
            else if (buildPath.startsWith("r/")) {
                let match = buildPath.match(/^r\/(.*)\?\/(.+)\/$/);
                if (!match) {
                    console.error(chalk_1.default.red(`invalid regex pattern: ${buildPath}`));
                    continue;
                }
                let dir = match[1];
                let regexStr = match[2];
                console.log(`parse --froms ${buildPath} => dir: ${dir}, regex: ${regexStr}`);
                let regex = new RegExp(regexStr);
                let files = fs.readdirSync(dir).filter(file => {
                    return regex.test(file) && fs.statSync(path.join(dir, file)).isFile();
                }).map(file => path.join(dir, file));
                validFileList.push(...files);
            }
            else {
                if (fs.statSync(buildPath).isDirectory()) {
                    function traverseDir(buildPath, recursive) {
                        let fileList = fs.readdirSync(buildPath);
                        for (let i = 0; i < fileList.length; i++) {
                            let filePath = fileList[i];
                            let state = fs.statSync(path.join(buildPath, filePath));
                            if (state.isDirectory()) {
                                if (recursive) {
                                    //继续向子目录查找
                                    traverseDir(path.join(buildPath, filePath), recursive);
                                }
                            }
                            else {
                                //找到xls文件
                                validFileList.push(path.join(buildPath, filePath));
                            }
                        }
                    }
                    traverseDir(buildPath, recursive);
                }
                else {
                    validFileList.push(buildPath);
                }
            }
        }
        // 去重
        validFileList = Array.from(new Set(validFileList))
            //点开头的为隐藏文件
            .filter(filePath => {
            return path.basename(filePath)[0] != "." && path.basename(filePath)[0] != "~" && path.extname(filePath) == ".xlsx";
        });
        let buildPromiseList = [];
        for (let buildPath of validFileList) {
            buildPromiseList.push(this.buildExcel(buildPath));
        }
        await Promise.all(buildPromiseList);
    }
    async buildExcel(excel) {
        var promise = new Promise((resolve, reject) => {
            let t1 = Date.now();
            fs.readFile(excel, (err, buffer) => {
                let t2 = Date.now();
                if (err) {
                    let t3 = Date.now();
                    console.error(chalk_1.default.red(`load excel<${excel}> failed, timecost: ${t2 - t1}, ${t3 - t2}`));
                    console.error(chalk_1.default.red(String(err)));
                    resolve();
                    return;
                }
                let workbook = new Workbook_1.Workbook();
                workbook.load(excel, buffer);
                this._list.push(workbook);
                let t4 = Date.now();
                console.log(`load excel<${excel}> done, timecost: ${t2 - t1}, ${t4 - t2}`);
                resolve();
            });
        });
        return promise;
    }
    /**
     * 获取工作簿列表
     */
    get workbooks() {
        return this._list.concat();
    }
    /**
     * 获取数据列表
     */
    get dataTables() {
        if (this._tables == null) {
            this._tables = [];
            for (let b of this._list) {
                for (let sheet of b.sheets) {
                    if (sheet && sheet.data.length >= 3) {
                        let datatable = new DataTable_1.DataTable(sheet, sheet.nameOrigin);
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
    getTableByName(name, workbookName) {
        return this.dataTables.find(a => a.nameOrigin == name && a.workbookName == workbookName);
    }
    /**
     * 检查所有表的错误
     */
    checkError() {
        this.dataTables.forEach(a => a.checkError());
    }
    collectScenes() {
        let scenes = [];
        this.workbooks.forEach(w => {
            for (let meta of w.metaManager.sceneMetas) {
                scenes.push(meta.name);
            }
        });
        return scenes;
    }
}
exports.WorkbookManager = WorkbookManager;
//# sourceMappingURL=WorkbookManager.js.map