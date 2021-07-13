#!/usr/bin/env node
import fs from 'fs';
import figlet from 'figlet';
import yargs from 'yargs';
import chalk from 'chalk';
import { parse } from '@yarnpkg/lockfile';
import fetch from 'node-fetch';

const args = yargs.options({
  'source': { type: 'string', demandOption: false, alias: 's', default: 'yarn.lock' }
}).argv;

// fetchFileSize('postcss-unique-selectors');

async function fetchFileSize(name: string, version?: string) {
  if (name.startsWith('@ali') || name.startsWith('@types') || name.startsWith('@babel')) {
    // @ali is interval packages, can not find size.
    return Promise.resolve('-');
  }

  const url = version ? `https://bundlephobia.com/api/size?package=${name}@${version}` : `https://bundlephobia.com/api/size?package=${name}`;

  return fetch(url).then(
    data => {
      return data.json();
    }
  ).then(data => {
    // console.log('data: ', data);
    if (data?.size) {
      // console.log('size in browser: ', (data.size / 1024).toFixed(2), 'kb');
      return +(data.size / 1024).toFixed(2);
    } else if (data?.error) {
      // console.error('Get package size error, url: ', url, '; code: ', data.error.code, '; message: ', data.error.message);
      return '-';
    } else {
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

figlet.text('Yarn Duplicate', {
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
  console.log(chalk.gray(data));

  let filePath;
  if ((args as any).source.startsWith('/')) {
    filePath = (args as any).source;
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red('File does not exists, ' + (args as any).source));
      process.exit(0);
    }
  } else {
    filePath = process.cwd() + '/' + (args as any).source;
    // filePath = '/Users/cam/ali/bi-engine/yarn.lock'; // FIXME
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red('No yarn.lock in current folder, please confirm, ' + process.cwd()));
      process.exit(0);
    }
  }
  await getDuplicatedPkgs(filePath);
});

interface PkgItem {
  name: string;
  requiredVersion: string;
  version: string;
  resolved: string;
  integrity: string;
  dependencies: { [key: string]: string }[];
}

async function getDuplicatedPkgs(path: string) {
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

  const duplicatedPkgTreeObj: { [key: string]: PkgItem[] } = {};
  installedPkgs.forEach(async pkg => {
    if (pkg.name === prevPkg.name && pkg.version !== prevPkg.version) {
      if (duplicatedPkgTreeObj[pkg.name] == null) {
        duplicatedPkgTreeObj[pkg.name] = [prevPkg];
      }
      duplicatedPkgTreeObj[pkg.name].push(pkg);
    }
    prevPkg = pkg;
  });

  if (Object.entries(duplicatedPkgTreeObj).length === 0) {
    console.log(chalk.green('🎉 Awesome, you have no duplicate packages, that\'s amazing!'));
  } else {
    console.log('😈 Summary: you have', chalk.red(Object.entries(duplicatedPkgTreeObj).length), 'duplicate packages in total, repeated', 
    chalk.red(Object.entries(duplicatedPkgTreeObj).reduce((result, curr) => result + curr[1].length, 0)), 'times!');
    console.log('👉 The details are as follows: ');
    
    const P = ['\\', '|', '/', '-'];
    let x = 0;
    const loader = setInterval(() => {
      process.stdout.write(chalk.gray(`\r${P[x++]}`));
      x %= P.length;
    }, 250);

    const pkgs = await Promise.all(Object.entries(duplicatedPkgTreeObj).map(async ([key, value]): Promise<any> => ({
      name: key, duplicates: value.length, "sizeInBrowser-KB": await fetchFileSize(key)
    })));

    clearInterval(loader);

    pkgs.sort((a, b) => { return b.value - a.value; });
    console.log('');
    console.table(pkgs, ['name', 'duplicates', 'sizeInBrowser-KB']);
  }
}

// TODO 基于重复的pkg，来做分析，找到重复的来源。
