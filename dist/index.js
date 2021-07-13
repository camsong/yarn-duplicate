#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const figlet_1 = __importDefault(require("figlet"));
const yargs_1 = __importDefault(require("yargs"));
const chalk_1 = __importDefault(require("chalk"));
const lockfile_1 = require("@yarnpkg/lockfile");
const node_fetch_1 = __importDefault(require("node-fetch"));
const args = yargs_1.default.options({
    'source': { type: 'string', demandOption: false, alias: 's', default: 'yarn.lock' }
}).argv;
// fetchFileSize('postcss-unique-selectors');
async function fetchFileSize(name, version) {
    if (name.startsWith('@ali') || name.startsWith('@types') || name.startsWith('@babel')) {
        // @ali is interval packages, can not find size.
        return Promise.resolve('-');
    }
    const url = version ? `https://bundlephobia.com/api/size?package=${name}@${version}` : `https://bundlephobia.com/api/size?package=${name}`;
    return node_fetch_1.default(url).then(data => {
        return data.json();
    }).then(data => {
        // console.log('data: ', data);
        if (data === null || data === void 0 ? void 0 : data.size) {
            // console.log('size in browser: ', (data.size / 1024).toFixed(2), 'kb');
            return +(data.size / 1024).toFixed(2);
        }
        else if (data === null || data === void 0 ? void 0 : data.error) {
            // console.error('Get package size error, url: ', url, '; code: ', data.error.code, '; message: ', data.error.message);
            return '-';
        }
        else {
            // unknow error
            return '-';
        }
    }, e => {
        // console.error('Get package size error, url: ', url, e);
        return '-';
    }).catch(e => {
        // console.error('Get package size error, url: ', url, e);
        return '-';
    });
}
figlet_1.default.text('Yarn Duplicate', {
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 100,
    whitespaceBreak: true
}, async function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(chalk_1.default.gray(data));
    let filePath;
    if (args.source.startsWith('/')) {
        filePath = args.source;
        if (!fs_1.default.existsSync(filePath)) {
            console.error(chalk_1.default.red('File does not exists, ' + args.source));
            process.exit(0);
        }
    }
    else {
        filePath = process.cwd() + '/' + args.source;
        // filePath = '/Users/cam/ali/bi-engine/yarn.lock'; // FIXME
        if (!fs_1.default.existsSync(filePath)) {
            console.error(chalk_1.default.red('No yarn.lock in current folder, please confirm, ' + process.cwd()));
            process.exit(0);
        }
    }
    await getDuplicatedPkgs(filePath);
});
async function getDuplicatedPkgs(path) {
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
    installedPkgs.forEach(async (pkg) => {
        if (pkg.name === prevPkg.name && pkg.version !== prevPkg.version) {
            if (duplicatedPkgTreeObj[pkg.name] == null) {
                duplicatedPkgTreeObj[pkg.name] = [prevPkg];
            }
            duplicatedPkgTreeObj[pkg.name].push(pkg);
        }
        prevPkg = pkg;
    });
    if (Object.entries(duplicatedPkgTreeObj).length === 0) {
        console.log(chalk_1.default.green('🎉 Awesome, you have no duplicate packages, that\'s amazing!'));
    }
    else {
        console.log('😈 Summary: you have', chalk_1.default.red(Object.entries(duplicatedPkgTreeObj).length), 'duplicate packages in total, repeated', chalk_1.default.red(Object.entries(duplicatedPkgTreeObj).reduce((result, curr) => result + curr[1].length, 0)), 'times!');
        console.log('👉 The details are as follows: ');
        const P = ['\\', '|', '/', '-'];
        let x = 0;
        const loader = setInterval(() => {
            process.stdout.write(chalk_1.default.gray(`\r${P[x++]}`));
            x %= P.length;
        }, 250);
        const pkgs = await Promise.all(Object.entries(duplicatedPkgTreeObj).map(async ([key, value]) => ({
            name: key, value: value.length, "sizeInBrowser-KB": await fetchFileSize(key)
        })));
        clearInterval(loader);
        pkgs.sort((a, b) => { return b.value - a.value; });
        console.table(pkgs, ['name', 'value', 'sizeInBrowser-KB']);
    }
}
// TODO 基于重复的pkg，来做分析，找到重复的来源。
