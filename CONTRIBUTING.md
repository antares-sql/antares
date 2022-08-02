# Contributors Guide

Antares SQL is an application based on [Electron.js](https://www.electronjs.org/) that uses [Vue.js](https://vuejs.org/) and [Spectre.css](https://picturepan2.github.io/spectre/) as frontend frameworks.  
For the build process it takes advantage of [electron-builder](https://www.electron.build/).  
This application uses [Pinia🍍](https://pinia.vuejs.org/) as application state manager and [electron-store](https://github.com/sindresorhus/electron-store) to save the various settings on disc.  
This guide aims to provide useful information and guidelines to everyone wants to contribute with this open-source project.
For every other question related to this project please [contact me](https://github.com/Fabio286).

## Project Structure

The main files of the application are located inside `src` folder and are groupped in three subfolders.

### `common`

This folder contains small libraries, classes and objects. The purpose of `common` folder is to group together utilities used by **renderer** and **main** processes.  
Noteworthy is the `customizations` folder that contains clients related customizations. Those settings are merged with `default.js` that lists every option.  
Client related customizations are stored on Pinia and can be accessed by `customizations` property of current workspace object, or importing `common/customizations`.  

An use case of customizations object can be the following:

```js
computed: {
      defaultEngine () {
         if (this.workspace.customizations.engines)
            return this.workspace.engines.find(engine => engine.isDefault).name;
         return '';
      }
}
```

In this case the computed property `defaultEngine` returns the default engine for MySQL client, or an empty string with PostgreSQL that doesn't have engines.  
Customization properties are also useful **if some features are ready for one client but not others**.

### `main`

Inside this folder are located all files required by main process.  
`ipc-handlers` subfolder includes all IPC handlers for events sent from renderer process.  
`libs` subfolder includes classes related to clients and **query and connection logics**.  
**Everything above client's class level should be "client agnostic"** with a neutral and uniformed api interface

### `renderer`

In this folder is located the structure of Vue frontend application.

## Build

The command to build Antares SQL locally is `npm run build`. 

## Conventions

### Electron

- **kebab-case** for IPC event names.

### Vue

- **PascalCase** for file names (with .vue extension) and including components inside others (`<MyComponent/>`).  
- "**Base**" prefix for [base component names](https://vuejs.org/v2/style-guide/#Base-component-names-strongly-recommended).
- "**The**" prefix for [single-instance component names](https://vuejs.org/v2/style-guide/#Single-instance-component-names-strongly-recommended).  
- [Tightly coupled component names](https://vuejs.org/v2/style-guide/#Tightly-coupled-component-names-strongly-recommended).
- [Order of words in component names](https://vuejs.org/v2/style-guide/#Order-of-words-in-component-names-strongly-recommended).
- **kebab-case** in templates for property and event names.

### Code Style

The project includes [ESlint](https://eslint.org/) and [StyleLint](https://stylelint.io/) config files with style rules. I recommend to set the lint on-save option in your code editor.  
Alternatively you can launch following commands to lint the project.  

Check if all the style rules have been followed:

```console
npm run lint
```

Apply style rules globally if possible:  

```console
npm run lint:fix
```

### Other recommendations

Please, use if possible **template literals** to compose strings and **avoid unnecessary dependencies**.

### Commits

The commit style adopted for this project is [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).  
Basicly it's important to have **single scoped commits with a prefix** that follows this style because Antares SQL uses [standard-version](https://github.com/conventional-changelog/standard-version) to generate new releases and [CHANGELOG.md](https://github.com/Fabio286/antares/blob/master/CHANGELOG.md) file to track all notable changes.  
For Visual Studio Code users may be useful [Conventional Commits](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits) extension.

## Debug

**Debug mode**:

```console
npm run debug
```

After running the debug mode Antares will listen on port 9222 (main process) for a debugger.  
On **Visual Studio Code** just launch "*Electron: Main*" configurations after running Antares in debug mode.
