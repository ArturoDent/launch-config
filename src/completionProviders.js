const vscode = require('vscode');


/**
 * @desc - register a CompletionProvider for keybindings.json
 * 
 * @param {object} context
 * @returns a CompletionProvider 
 */
exports.makeKeybindingsCompletionProvider = function(context) {
    const configCompletionProvider = vscode.languages.registerCompletionItemProvider (
      { pattern: '**/keybindings.json' },
      {
                            // eslint-disable-next-line no-unused-vars
        provideCompletionItems(document, position, token, context) {

                            // {
                            //   "key": "alt+f",
                            //   "command": "launches.<completion here>"
                            // },

          // get all text until the `position` and check if it reads `"launches.`
          const linePrefix = document.lineAt(position).text.substr(0, position.character);
          if (!linePrefix.endsWith('"launches.')) {
            return undefined;
          }

          const launches = vscode.workspace.getConfiguration("launches");
          let completionItemArray = [];

          // look at each 'launches' setting
          for (const item in launches) {
            if ((typeof launches[item] !== 'string')) {
                continue;
            }
            else {
              completionItemArray.push(makeCompletionItem(item, position));
            }
          }
          return completionItemArray;
        }
      },
      '.'       // trigger intellisense/completion
    );

  context.subscriptions.push(configCompletionProvider);
}


/**
 * @desc - register a CompletionProvider for settings.json
 * 
 * @param {object} context
 * @returns a CompletionProvider 
 */
exports.makeSettingsCompletionProvider = function(context) {
  const settingsCompletionProvider = vscode.languages.registerCompletionItemProvider (
    { pattern: '**/settings.json' },
    {
                        // eslint-disable-next-line no-unused-vars
      provideCompletionItems(document, position, token, context) {

                        // "launches": {
                        //   "RunNodeCurrentFile": "Launch File",
                        //   "RunCompound1": "Launch file and start chrome"
                        //   "someName": "<completion here>"
                        // },

        // get all text until the current `position` and check if it reads `:\s*"$` at the end
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const regex = /:\s*"$/g;
        if (linePrefix.search(regex) === -1) {
          return undefined;
        }

        const launchConfigs = vscode.workspace.getConfiguration("launch");
        let nameArray = launchConfigs.get('configurations');
        nameArray = nameArray.concat(launchConfigs.get('compounds'));

        let completionItemArray = [];

        for (const item in nameArray) {
          if ((typeof nameArray[item].name !== 'string')) {
              continue;
          }
          else {
                        // "configurations": [
                        //   {
                        //     "name": "Launch File",
                        
            completionItemArray.push(makeCompletionItem(nameArray[item].name, position));
          }
        }
        return completionItemArray;
      }
    },
    '"'       // trigger intellisense/completion
  );

  context.subscriptions.push(settingsCompletionProvider);
}


/**
 * @desc - from a string input make a CompletionItemKind.Text
 * 
 * @param {string} key 
 * @param {object} position
 * @returns - CompletionItemKind.Text
 */
function makeCompletionItem(key, position)  {
  let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
  item.range = new vscode.Range(position, position);
  return item;
}