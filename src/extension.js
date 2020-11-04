const vscode = require('vscode');
const providers = require('./completionProviders');

let disposables = [];


/**
 * @desc - fetch launch configuration user setting: 'launches'
 * @desc - get matching launch.json configuration
 * @desc - run/launch debug originally triggered with a keybinding
 * 
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

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
}

function loadLaunchSettings(context) {

  // load the 'launches' settings
                                          // "launches": {
                                          //    "RunNodeCurrentFile": "Launch File",
                                          //    "RunCompound1": "Launch file and start chrome"
                                          // },

  const launches = vscode.workspace.getConfiguration("launches");

  // look at each 'launches' setting
  for (const name in launches) {
      if ((typeof launches[name] !== 'string')) {
          continue;
      }
      // register each one as a command
      const disposable = vscode.commands.registerCommand(`launches.${name}`, () => launchSelectedConfig(launches[name]));
      context.subscriptions.push(disposable);
      disposables.push(disposable);
  }
}

/**
 * @desc - start a debug session of the named launch configuration
 * @param {string} name - the 'name' key of one launch configuration/compound
 */
async function launchSelectedConfig(name) {
  let currentWorkSpace = await activeWorkspaceFolder();
  await vscode.debug.startDebugging(currentWorkSpace, name);
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
