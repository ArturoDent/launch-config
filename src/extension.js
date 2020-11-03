const vscode = require('vscode');

let disposables = [];


/**
 * @desc - fetch launch configuration user setting
 * @desc - get matching launch.json configuration
 * @desc - run/launch debug originally triggered with a keybinding
 * 
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  loadLaunchSettings(context);

  // let docFilter = { language: 'json', scheme: 'vscode-userdata', pattern: keybindingsPath };  // doesn't work

  const configCompletionProvider = vscode.languages.registerCompletionItemProvider (

    { pattern: '**/keybindings.json' },

    {
      // eslint-disable-next-line no-unused-vars
      provideCompletionItems(document, position, token, context) { 

                          // {
                          //   "key": "alt+f",
                          //   "command": "launches."
                          // },

        // get all text until the `position` and check if it reads `"launches.`
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        if (!linePrefix.endsWith('"launches.')) {
          return undefined;
        }

        let makeCompletionItem = (key) => { 
          let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
          item.range = new vscode.Range(position, position);
          return item;
        }

        const launches = vscode.workspace.getConfiguration("launches");
        let completionItemArray = [];

        // look at each 'launches' setting
        for (const key in launches) {
          if ((typeof launches[key] !== 'string')) {
              continue;
          }
          else {
            completionItemArray.push(makeCompletionItem(key));
          }
        }
        return completionItemArray;
      }
    },

    '.'       // trigger intellisense/completion
  );

  context.subscriptions.push(configCompletionProvider);

  // whenever settings are changed
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

async function launchSelectedConfig(name) {
  // let currentWorkSpace = vscode.workspace.workspaceFolders[0]; 

  let currentWorkSpace = await activeWorkspaceFolder();
  await vscode.debug.startDebugging(currentWorkSpace, name);
}

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
