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

          // get all text until the cursor `position` and check if it reads `"launches.`
          const linePrefix = document.lineAt(position).text.substr(0, position.character);
          if (!linePrefix.endsWith('"launches.')) {
            return undefined;
          }

          const launches = vscode.workspace.getConfiguration("launches");
          let completionItemArray = [];

          // look at each 'launches' setting
          for (const item in launches) {

            // "RunAsArray": ["Launch File (BuildSACC)", "Launch File (TestMultiRoot)"],
            if (typeof launches[item] === 'object') {
              completionItemArray.push(makeCompletionItem(item, position));
            }
            else if ((typeof launches[item] !== 'string')) {
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
                        //   "RunNodeCurrentFile": "Launch File (workspaceFolderName1)",
                        //   "RunCompound1": "Launch file and start chrome (workspaceFolderName2)"
                        //   "someName": "<completion here>"
                        // },

        // get all text until the current `position` and check if it reads `:\s*"$` at the end
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        // const regex = /:\s*"$/g;
        const regex = /[:,]\s*("|\[")$/g;
        if (linePrefix.search(regex) === -1) {
          return undefined;
        }

        const workSpaceFolders = vscode.workspace.workspaceFolders;
        let launchConfigs;
        let nameArray = [];

        workSpaceFolders.forEach((workSpace) => {

          launchConfigs = vscode.workspace.getConfiguration('launch', workSpace.uri);
          let configArray = launchConfigs.get('configurations');
          configArray = configArray.concat(launchConfigs.get('compounds'));

          configArray.forEach(config => {
            if (typeof config.name === 'string') {
              nameArray.push(`${ config.name } (${ workSpace.name })`);
            }
          });
        });

        let completionItemArray = [];

        for (const item in nameArray) {
          if ((typeof nameArray[item] !== 'string')) {
              continue;
          }
          else {
                        // "configurations": [
                        //   {
                        //     "name": "Launch File",
                        
            completionItemArray.push(makeCompletionItem(nameArray[item], position));
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

  const regex = /^(.+)\s\((.*)\)$|^(.*)$/m;
      // eslint-disable-next-line no-unused-vars
  let [fullString, configName, folderName] = key.match(regex);
  
  item.sortText = folderName;
  return item;
}