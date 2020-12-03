const vscode = require('vscode');
const providers = require('./completionProviders');

// const bindings = require('./testKeybindingsRetrieval');

let disposables = [];


/**
 * @desc - fetch launch configuration user setting: 'launches'
 * @desc - get matching launch.json configuration
 * @desc - run/launch debug originally triggered with a keybinding
 * 
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

      // {
      //   command: "launches.showAllLaunchConfigs",
      //   title: "Launch Configs: Show all launch configurations",
      // }

  loadLaunchSettings(context);
  providers.makeKeybindingsCompletionProvider(context);
  providers.makeSettingsCompletionProvider(context);

  let disposable = vscode.commands.registerCommand('launches.showAllLaunchConfigs', async function () {

    const workSpaceFolders = vscode.workspace.workspaceFolders;
    let nameArray = providers.getLaunchConfigNameArray(workSpaceFolders);

    // add space to the nameArray just for the QuickPick
    // unfortunately the QuickPick panel is not rendered in a monospaced font so this has to be just a guess

    const regex = /^(.+?)\s*(\(.*\))$|^(.*)$/m;  

    nameArray = nameArray.map(name => {

          // eslint-disable-next-line no-unused-vars
      let [fullString, configName, folderName] = name.match(regex);
      let padding = (80 - configName.length > 0) ? (80 - configName.length)/1.4 : 1;
      return configName.padEnd(padding, ' ') + folderName;
    });

    return vscode.window.showQuickPick(nameArray, {
      canPickMany: true,
      placeHolder: "Select launch configuration(s) to run"
    }).then(items => {
      if (items) {
        if (Array.isArray(items)) {
          launchArrayOfConfigs(items);  // if multiple selections: array
        }
        else launchSelectedConfig(items);  // if only one config selected = string
      }
    });
  });
  context.subscriptions.push(disposable);
  disposables.push(disposable);

  // whenever settings.json, launch.json or tasks.json are changed
  vscode.workspace.onDidChangeConfiguration(() => {
      for (let disposable of disposables) {
          disposable.dispose()
      }
      // reload
    loadLaunchSettings(context);
  });

  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    loadLaunchSettings(context);
  })
}

/**
 * @description - get 'launches' seting and registerCommands for them
 * @param {Object} context - ExtensionContext
 * @returns - nothing
 */
function loadLaunchSettings(context) {

  // load the 'launches' settings
                                  // "launches": {
                                  //    "RunNodeCurrentFile": "Launch File (workspaceFolderName)",
                                  //    "RunCompound1": "Launch file and start chrome"
                                  // },

  const launches = vscode.workspace.getConfiguration("launches");

  // look at each 'launches' setting
  for (const name in launches) {
    if ((typeof launches[name] !== 'string') && (!Array.isArray(launches[name]))) {
        continue;
    }

    let disposable;

    // register each one as a command
    // launches[name] === "Launch File (Project A Folder)" or ["Launch File (BuildSACC)"]
    // `launches.${name}` === "launches.RunNodeCurrentFile" or "launches.RunAsArray"

    if (Array.isArray(launches[name])) {
      disposable = vscode.commands.registerCommand(`launches.${ name }`, () => launchArrayOfConfigs(launches[name]));
    }
    else {
      disposable = vscode.commands.registerCommand(`launches.${ name }`, () => launchSelectedConfig(launches[name]));
    }
    context.subscriptions.push(disposable);
    disposables.push(disposable);
  }
}

/**
 * 
 * @param {Array} nameArray - an array of config names to run simultaneously
 */
async function launchArrayOfConfigs(nameArray) {  
  // something more synchronous than forEach ***
  nameArray.forEach(async name => await launchSelectedConfig(name));
}

/**
 * @desc - start a debug session of the named launch configuration
 * @param {string} name - the 'name' key of one launch configuration/compound
 */
async function launchSelectedConfig(name) {

  // "Launch Build.js (Project A Folder)"    // get the workspaceFolder.uri of (<someFolderName>)
  // ^(.+)\s\((.*)\)$|^(.*)$  // with or without a workspaceFolderName at the end

  const regex = /^(.+?)\s+\(([^)]*)\)$|^(.*)$/m;
      // eslint-disable-next-line no-unused-vars
  let [ fullString, configName, folderName, configNameNoFolder ] = name.match(regex);
  
  let ConfigWorkSpaceFolder;

  // check if folderName is empty, if so use the  workSpaceFolder of the active editor
  if (!folderName) ConfigWorkSpaceFolder = await activeWorkspaceFolder();
  else ConfigWorkSpaceFolder = vscode.workspace.workspaceFolders.find(ws => ws.name === folderName);

  configName = configName ? configName : configNameNoFolder;

  await vscode.debug.startDebugging(ConfigWorkSpaceFolder, configName);
}

/**
 * @desc - if multiple WorkSpaceFolders in the WorkSpace
 * @returns - the WorkSpaceFolder of the currently active file
 */
async function activeWorkspaceFolder ()  {
  const folders = await vscode.workspace.workspaceFolders;
  if (!folders)  vscode.window.showErrorMessage('There is no workspacefolder open.')
  return await vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
};


function deactivate() {}

exports.activate = activate;

module.exports = {
	activate,
	deactivate
}
