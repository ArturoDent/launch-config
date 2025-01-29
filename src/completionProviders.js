const vscode = require('vscode');
const utilities = require('./utilities');


/**
 * register a CompletionItemProvider for keybindings.json
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

          // get all text until the cursor `position` and check if it ends with `"launches.` or '"args": "'
          const linePrefix = document.lineAt(position).text.substring(0, position.character);

          const prevLine = document.lineAt(position.line - 1).text;

          if (!linePrefix.endsWith('"launches.') && linePrefix.search(/"args"\s*:\s*"$/m) === -1) {
            return undefined;
          }

          // keybinding "args" completion
					if ((linePrefix.search(/"args"\s*:\s*"$/) !== -1) && (prevLine.search(/"command"\s*:\s*"launches\./) !== -1)) {
						return [
							makeCompletionItem('start'),
							makeCompletionItem('stop'),
							makeCompletionItem('stop/start'),
							makeCompletionItem('restart')
						];
					}

          // "command": "launches." completion
					if (linePrefix.search(/"command": "launches\./) !== -1) {
						const launches = vscode.workspace.getConfiguration("launches");
						let completionItemArray = [];

						// look at each 'launches' setting
						for (const item in launches) {

							// "RunAsArray": ["Launch File (BuildSACC)", "Launch File (TestMultiRoot)"],
							if ((typeof launches[item] !== 'string') && (!Array.isArray(launches[item]))) {
								continue;
							}
							else {
								completionItemArray.push(makeCompletionItem(item));
							}
						}
						return completionItemArray;
					}
					else return undefined;
        }
      },
      '.', '"'       // trigger intellisense/completion
    );

  context.subscriptions.push(configCompletionProvider);
}


/**
 * register a CompletionItemProvider for settings.json from launch/compound configs
 * @param {vscode.ExtensionContext} context
 */
exports.makeSettingsCompletionProvider = function(context) {
  const settingsCompletionProvider = vscode.languages.registerCompletionItemProvider (
    { pattern: '**/settings.json' },
    {
      async provideCompletionItems(document, position) {

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
																												   // no }'s within the launches setting!!
        regex = /(?<launches>"launches"\s*:\s*{[^}]*?})/;  // our 'launches' setting
        let launchMatch = fullText.match(regex);

        /** @type { vscode.Position } */
        let startPos;
        let endPos;

        if (launchMatch?.index && launchMatch?.groups) {
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
            completionItemArray.push(makeCompletionItem(nameArray[item]));
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
 * build an array of all config/compound launch names
 *
 * @param {readonly vscode.WorkspaceFolder[] | undefined} workSpaceFolders - an array
 * @returns {String[]} nameArray
 */
function getLaunchConfigNameArray (workSpaceFolders) {

  /** @type { Array<string> }*/
  let nameArray = [];
  
  // C: \Users\markm\AppData\Roaming\Code - Insiders\User\settings.json
  // let settingsConfigs = vscode.workspace.getConfiguration('launch', vscode.Uri.file('C: \Users\markm\AppData\Roaming\Code - Insiders\User\settings.json'));
  // const values = settingsConfigs.get('configurations');
  
  if (workSpaceFolders) {
    workSpaceFolders.forEach((workSpace) => {

      let launchConfigs = vscode.workspace.getConfiguration('launch', workSpace.uri);
      // const values = vscode.workspace.getConfiguration('launch').inspect('configurations');
      // if (values?.globalValue.length) nameArray.push(`${values.globalValue[0].name}   (settings)`);
      
      let configArray = launchConfigs.get('configurations');
      configArray = configArray.concat(launchConfigs.get('compounds'));

      // TODO is this necessary - the padding part?
      configArray.forEach(( /** @type {{ name: string | any[]; }} */ config) => {
        if (typeof config.name === 'string') {
          // to move the folder name out to the right so they align better, easier to read
          // let padding = (32 - config.name.length > 0) ? 32 - config.name.length : 1;
          // let fill = ' '.padEnd(padding);
          // nameArray.push(`${ config.name }${ fill }(${ workSpace.name })`);
          nameArray.push(`${ config.name }(${ workSpace.name })`);
        }
      });
    });
  }
  return nameArray;
}


/**
 * from a string input make a CompletionItemKind.Text
 *
 * @param {string} key
 * @returns {vscode.CompletionItem} - CompletionItemKind.Text
 */
function makeCompletionItem(key) {

  let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
  
  // no longer necessary after 
  //  https://stackoverflow.com/questions/60001714/custom-extension-for-json-completion-does-not-work-in-double-quotes
  // item.range = new vscode.Range(position, position);

  let setting = utilities.parseConfigurationName(key);

  item.sortText = setting.folder;

  // remove spaces added to align folders in completionProvider
  let stripSpaces = /(\s{2,})(\([^)]+\))$/g;
  item.insertText = key.replace(stripSpaces, ' $2');

  return item;
}
exports.getLaunchConfigNameArray = getLaunchConfigNameArray;