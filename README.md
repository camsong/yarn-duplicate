# Yarn Duplicate

A small tool to help you check duplicate package and package size in `yarn.lock`.

### Usage
1. Change to your project root folder, which have a `yarn.lock` file.
2. ` npx yarn-duplicate`

That's all!

PS: If you don't have `npx` installed, use: 

```sh
npm install -g yarn-duplicate
yarn-duplicate
```

### Caveats
Only support Yarn V1.x right now.

### Showcase
Run duplicate check under [redux](https://github.com/reduxjs/redux) source code
![duplicate package example](https://user-images.githubusercontent.com/948896/125469600-a523bf97-594c-4de5-9c78-2d290128fdaf.png)

Meaning of columns:
* `name`: name of the npm package
* `duplicates`: times of the package duplicates
* `sizeInBrowser-KB`: package size in bowser by KB.


If there're no duplicate packages, the result would be:
![image](https://user-images.githubusercontent.com/948896/125404466-39b54c00-e3e9-11eb-8e47-505c2da696d2.png)
