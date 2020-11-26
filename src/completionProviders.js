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
                        //   "someName": ["<completion here>"]
                        // },

        // get all text until the current `position` and check if it reads `:\s*"$` at the end
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        // works in arrays as well
        const regex = /[:,]\s*("|\[")$/g;
        if (linePrefix.search(regex) === -1) {
          return undefined;
        }

        const workSpaceFolders = vscode.workspace.workspaceFolders;
        let nameArray = getLaunchConfigNameArray(workSpaceFolders);

        if (nameArray.length === 0) return [];  // return an empty array
        let completionItemArray = [];

        for (const item in nameArray) {
          if ((typeof nameArray[item] !== 'string')) {
              continue;
          }
          else {
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
 * @desc - build an array of all config/compound launch names
 * 
 * @param {object} workSpaceFolders - an array
 * @returns {object} nameArray
 */
function getLaunchConfigNameArray (workSpaceFolders) {

  let launchConfigs;
  let nameArray = [];

  // configurations and compounds in '*.code-workspace' file of multi-root workspace
  // let configArray = vscode.workspace.getConfiguration('launch').compounds;
  // configArray = configArray.concat(vscode.workspace.getConfiguration('launch').configurations);

  // configArray.forEach(config => {
  //   if (typeof config.name === 'string') {
  //     nameArray.push(`${ config.name }`);
  //   }
  // });
  
  workSpaceFolders.forEach((workSpace) => {

    launchConfigs = vscode.workspace.getConfiguration('launch', workSpace.uri);
    let configArray = launchConfigs.get('configurations');
    configArray = configArray.concat(launchConfigs.get('compounds'));

    configArray.forEach(config => {
      if (typeof config.name === 'string') {
        // to move the folder name out to the right so they align better, easier to read
        let padding = (32 - config.name.length > 0) ? 32 - config.name.length : 1;
        let fill = ' '.padEnd(padding);
        nameArray.push(`${ config.name }${ fill }(${ workSpace.name })`);
      }
    });
  });
  return nameArray;
}


/**
 * @desc - from a string input make a CompletionItemKind.Text
 * 
 * @param {string} key 
 * @param {object} position
 * @returns - CompletionItemKind.Text
 */
function makeCompletionItem(key, position) {
  
  let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
  item.range = new vscode.Range(position, position);

  const regex = /^(.+)\s\((.*)\)$|^(.*)$/m;
      // eslint-disable-next-line no-unused-vars
  let [fullString, configName, folderName] = key.match(regex);
  
  item.sortText = folderName;

  // remove spaces added to align folders in completionProvider
  let stripSpaces = /(\s{2,})(\([^)]+\))$/g;
  item.insertText = key.replace(stripSpaces, ' $2');
  
  return item;
}

exports.getLaunchConfigNameArray = getLaunchConfigNameArray;