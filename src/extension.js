const vscode = require('vscode');
// const process = require('process');

// let activeContext;
let disposables = [];
let launches = {};


/**
 * @desc - fetch launch configuration user setting
 * @desc - get matching launch.json configuration
 * @desc - run/launch debug originally triggered with a keybinding
 * 
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  loadLaunchSettings(context);

  // const keybindingsPath = getEditorInfo();
  // let docFilter = { language: 'json', scheme: 'vscode-userdata', pattern: keybindingsPath };

  const configCompletionProvider = vscode.languages.registerCompletionItemProvider (

    'json',
    {
      // eslint-disable-next-line no-unused-vars
      provideCompletionItems(document, position, token, context) { 

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
    '.' // trigger
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

exports.activate = activate;

function deactivate() {}

function loadLaunchSettings(context) {

    // load the launches settings
    launches = vscode.workspace.getConfiguration("launches");

    // look at each macro
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
  let thisWorkspace = vscode.workspace.workspaceFolders[0];
  await vscode.debug.startDebugging(thisWorkspace, name);
}

// function getEditorInfo() { 
//     const editor = vscode.window.activeTextEditor;
//     const resource = editor.document.uri;
//     console.log(resource);  // fsPath, path, toString()
//     return resource.fsPath;
// }

module.exports = {
	activate,
	deactivate
}
