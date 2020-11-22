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

  // bindings.get();  return;

  loadLaunchSettings(context);
  providers.makeKeybindingsCompletionProvider(context);
  providers.makeSettingsCompletionProvider(context);

  // whenever settings.json, launch.json or tasks.json are changed
  vscode.workspace.onDidChangeConfiguration(() => {
      for (let disposable of disposables) {
          disposable.dispose()
      }
      // reload them
    loadLaunchSettings(context);
  });

  vscode.workspace.onDidChangeWorkspaceFolders(() => {
    loadLaunchSettings(context);
  })
}

function loadLaunchSettings(context) {

  // load the 'launches' settings
                                  // "launches": {
                                  //    "RunNodeCurrentFile": "Launch File (workspaceFolderName)",
                                  //    "RunCompound1": "Launch file and start chrome"
                                  // },

  const launches = vscode.workspace.getConfiguration("launches");

  // look at each 'launches' setting
  for (const name in launches) {
    // if (typeof launches[name] !== 'string') {
    if ((typeof launches[name] !== 'string') && (typeof launches[name] !== 'object')) {
        continue;
    }

    let disposable;

    // register each one as a command
    // launches[name] === "Launch File (Project A Folder)" or ["Launch File (BuildSACC)"]
    // `launches.${name}` === "launches.RunNodeCurrentFile" or "launches.RunAsArray"

    if (typeof launches[name] === 'object') {
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
 * @param {object} nameArray - an array of config names to run simultaneously
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

  const regex = /^(.+)\s\((.*)\)$|^(.*)$/m;
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
