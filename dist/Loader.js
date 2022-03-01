"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchWithCmdOptions = void 0;
const yargs = require("yargs");
const exportCmd = require("./commands/export");
const tokithelper_1 = require("./tokithelper");
function launchWithCmdOptions() {
    if (tokithelper_1.tokitHelper.launchOptions) {
        const curdir = `${tokithelper_1.tokitHelper.projectDir}`;
        const argv = tokithelper_1.tokitHelper.convToYargs(tokithelper_1.tokitHelper.launchOptions);
        let cmd = process.argv[2];
        if (cmd == "export") {
            argv.alls = argv.alls.split(" ");
            argv.allnames = argv.allnames.split(" ");
            argv.inject = argv.inject.split(" ");
            exportCmd.handler(argv);
        }
    }
    else {
        yargs
            .command(exportCmd)
            .help("h").argv;
    }
}
exports.launchWithCmdOptions = launchWithCmdOptions;
//# sourceMappingURL=Loader.js.map