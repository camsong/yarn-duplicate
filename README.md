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
![duplicate package example](https://user-images.githubusercontent.com/948896/125404240-01ae0900-e3e9-11eb-84ef-88b15e244190.png)

If there're no duplicated packages:
![image](https://user-images.githubusercontent.com/948896/125404466-39b54c00-e3e9-11eb-8e47-505c2da696d2.png)
