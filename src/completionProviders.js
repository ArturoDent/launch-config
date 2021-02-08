const vscode = require('vscode');
const utilities = require('./utilities');


/**
 * @description - register a CompletionItemProvider for keybindings.json
 * @param {vscode.ExtensionContext} context
 */
exports.makeKeybindingsCompletionProvider = function(context) {
    const configCompletionProvider = vscode.languages.registerCompletionItemProvider (
      { pattern: '**/keybindings.json' },
      {
        provideCompletionItems(document, position) {

              // {
              //   "key": "alt+f",
              //   "command": "launches.<completion here>",  <== from settings.json
              //   "args": "restart"  <== optional
              // },

          // get all text until the cursor `position` and check if it reads `"launches.`
          const linePrefix = document.lineAt(position).text.substr(0, position.character);

          // for args intellisense in keybindings.json
          // (?<="launches\.)[^{]*\n^.*"args": "
          // const prevLine = document.lineAt(position.line - 1).text;
          // if (prevLine.search)

          if (!linePrefix.endsWith('"launches.')) {
            return undefined;
          }

          const launches = vscode.workspace.getConfiguration("launches");
          let completionItemArray = [];

          // look at each 'launches' setting
          for (const item in launches) {

            // "RunAsArray": ["Launch File (BuildSACC)", "Launch File (TestMultiRoot)"],
            if ((typeof launches[item] !== 'string') && (!Array.isArray(launches[item]))) {
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
      // '.', '"'       // trigger intellisense/completion
    );

  context.subscriptions.push(configCompletionProvider);
}


/**
 * @description - register a CompletionItemProvider for settings.json from launch/compound configs
 * @param {vscode.ExtensionContext} context
 */
exports.makeSettingsCompletionProvider = function(context) {
  const settingsCompletionProvider = vscode.languages.registerCompletionItemProvider (
    { pattern: '**/settings.json' },
    {
      provideCompletionItems(document, position) {

            // "launches": {
            //   "RunNodeCurrentFile": "Launch File (workspaceFolderName1)",
            //   "RunCompound1": "Launch file and start chrome (workspaceFolderName2)"
            //   "someName": "<name> (<workspaceFolder.name>)" <== completions here
            // },

        // get all text until the current `position` and check if it reads `:\s*"$` before the cursor
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        // works in arrays as well
        let regex = /[:,]\s*("|\[")$/g;
        if (linePrefix.search(regex) === -1) {
          return undefined;
        }

        // check that cursor position is within "launches": { | }, i.e., within our "launches" setting

        let fullText = document.getText();
        regex = /(?<launches>"launches"\s*:\s*{[^}]*?})/;  // our 'launches' setting
        let launchMatch = fullText.match(regex);

        /** @type { vscode.Position } */
        let startPos;
        let endPos;

        if (launchMatch && launchMatch.index && launchMatch.groups) {
          startPos = document.positionAt(launchMatch.index);  // "launches" index
          endPos = document.positionAt(launchMatch.index + launchMatch.groups.launches.length);


          let launchRange = new vscode.Range(startPos, endPos);
          if (!launchRange.contains(position)) return undefined;  // cursor is not in the 'launches' setting
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
 * @description - build an array of all config/compound launch names
 *
 * @param {readonly vscode.WorkspaceFolder[] | undefined} workSpaceFolders - an array
 * @returns {String[]} nameArray
 */
function getLaunchConfigNameArray (workSpaceFolders) {

  /** @type { Array<string> }*/
  let  nameArray = [];

  if (workSpaceFolders) {
    workSpaceFolders.forEach((workSpace) => {

      let launchConfigs = vscode.workspace.getConfiguration('launch', workSpace.uri);

      let configArray = launchConfigs.get('configurations');
      configArray = configArray.concat(launchConfigs.get('compounds'));


      configArray.forEach(( /** @type {{ name: string | any[]; }} */ config) => {
        if (typeof config.name === 'string') {
          // to move the folder name out to the right so they align better, easier to read
          let padding = (32 - config.name.length > 0) ? 32 - config.name.length : 1;
          let fill = ' '.padEnd(padding);
          nameArray.push(`${ config.name }${ fill }(${ workSpace.name })`);
        }
      });
    });
  }
  return nameArray;
}


/**
 * @description - from a string input make a CompletionItemKind.Text
 *
 * @param {string} key
 * @param {vscode.Position} position
 * @returns {vscode.CompletionItem} - CompletionItemKind.Text
 */
function makeCompletionItem(key, position) {

  let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
  item.range = new vscode.Range(position, position);

  let setting = utilities.parseConfigurationName(key);

  item.sortText = setting.folder;

  // remove spaces added to align folders in completionProvider
  let stripSpaces = /(\s{2,})(\([^)]+\))$/g;
  item.insertText = key.replace(stripSpaces, ' $2');

  return item;
}

exports.getLaunchConfigNameArray = getLaunchConfigNameArray;