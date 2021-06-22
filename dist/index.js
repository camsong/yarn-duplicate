#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const figlet_1 = __importDefault(require("figlet"));
const yargs_1 = __importDefault(require("yargs"));
const lockfile_1 = require("@yarnpkg/lockfile");
function consoleError(str) {
    console.log(`\x1b[41m`, str);
}
const args = yargs_1.default.options({
    'source': { type: 'string', demandOption: false, alias: 's', default: 'yarn.lock' }
}).argv;
figlet_1.default.text('Yarn Duplicate', {
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 100,
    whitespaceBreak: true
}, function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data);
    let filePath;
    if (args.source.startsWith('/')) {
        filePath = args.source;
        if (!fs_1.default.existsSync(filePath)) {
            consoleError('File does not exists, ' + args.source);
            process.exit(0);
        }
    }
    else {
        filePath = process.cwd() + '/' + args.source;
        if (!fs_1.default.existsSync(filePath)) {
            consoleError('No yarn.lock in current folder, please confirm, ' + process.cwd());
            process.exit(0);
        }
    }
    getDuplicatedPkgs(filePath);
});
function getDuplicatedPkgs(path) {
    const parsed = lockfile_1.parse(fs_1.default.readFileSync(path, 'utf8'));
    const installedPkgs = [];
    if (parsed && parsed.type === 'success') {
        Object.entries(parsed.object).forEach(([key, value]) => {
            installedPkgs.push(Object.assign({ name: key.substr(0, key.lastIndexOf('@')), requiredVersion: key.substr(key.lastIndexOf('@') + 1) }, value));
        });
    }
    /**
     * 存放重复的包。
     * 计算逻辑：installedPkgs 是安装字母排序的，匹配 name 和 installedVersion 如果 name 与上一个相同，但 installedVersion 不同就说明包重复了
     */
    let prevPkg = installedPkgs.length > 0 ? installedPkgs[0] : {};
    const duplicatedPkgTreeObj = {};
    installedPkgs.forEach(pkg => {
        if (pkg.name === prevPkg.name && pkg.version !== prevPkg.version) {
            if (duplicatedPkgTreeObj[pkg.name] == null) {
                duplicatedPkgTreeObj[pkg.name] = [prevPkg];
            }
            duplicatedPkgTreeObj[pkg.name].push(pkg);
        }
        prevPkg = pkg;
    });
    console.log('The duplicate packages are as follows:');
    const pkgs = Object.entries(duplicatedPkgTreeObj).map(([key, value]) => ({ name: key, value: value.length }));
    pkgs.sort((a, b) => { return b.value - a.value; });
    console.table(pkgs, ['name', 'value']);
}
// TODO 基于重复的pkg，来做分析，找到重复的来源。
