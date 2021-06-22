#!/usr/bin/env node
import fs from 'fs';
import figlet from 'figlet';
import yargs from 'yargs';
import { parse } from '@yarnpkg/lockfile';

function consoleError(str: string) {
  console.log(`\x1b[41m`, str);
}

const args = yargs.options({
  'source': { type: 'string', demandOption: false, alias: 's', default: 'yarn.lock' }
}).argv;


figlet.text('Yarn Duplicate', {
  horizontalLayout: 'default',
  verticalLayout: 'default',
  width: 100,
  whitespaceBreak: true
}, function(err, data) {
  if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
  }
  console.log(data);

  let filePath;
  if((args as any).source.startsWith('/')) {
    filePath = (args as any).source;
    if (!fs.existsSync(filePath)) {
      consoleError('File does not exists, ' + (args as any).source);
      process.exit(0);
    }
  } else {
    filePath = process.cwd() + '/' + (args as any).source;
    if (!fs.existsSync(filePath)) {
      consoleError('No yarn.lock in current folder, please confirm, ' + process.cwd());
      process.exit(0);
    }
  }
  getDuplicatedPkgs(filePath);
});

interface PkgItem {
  name: string;
  requiredVersion: string;
  version: string;
  resolved: string;
  integrity: string;
  dependencies: { [key: string]: string }[];
}

function getDuplicatedPkgs(path: string) {
  const parsed = parse(fs.readFileSync(path, 'utf8'));

  const installedPkgs = [] as PkgItem[];
  
  if (parsed && parsed.type === 'success') {
    Object.entries(parsed.object).forEach(([key, value]) => {
      installedPkgs.push({
        name: key.substr(0, key.lastIndexOf('@')),
        requiredVersion: key.substr(key.lastIndexOf('@') + 1),
        ...value as any
      });
    });
  }
  
  /**
   * 存放重复的包。
   * 计算逻辑：installedPkgs 是安装字母排序的，匹配 name 和 installedVersion 如果 name 与上一个相同，但 installedVersion 不同就说明包重复了
   */
  let prevPkg = installedPkgs.length > 0 ? installedPkgs[0] : {} as PkgItem;
  
  const duplicatedPkgTreeObj: {[key: string]: PkgItem[]} = {};
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
  const pkgs = Object.entries(duplicatedPkgTreeObj).map(([key, value]) => ({ name: key, value: value.length}));
  pkgs.sort((a, b) =>  { return b.value - a.value; });
  console.table(pkgs, ['name', 'value']);
}

// TODO 基于重复的pkg，来做分析，找到重复的来源。
