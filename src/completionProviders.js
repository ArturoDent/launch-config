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

              // TODO: get straight from launch.json or launch setting? 

          // get all text until the cursor `position` and check if it ends with `"launches.` or '"args": "'
          const linePrefix = document.lineAt(position).text.substring(0, position.character);
          const prevLine = document.lineAt(position.line - 1).text;

          if (!linePrefix.endsWith('"launches.') && linePrefix.search(/"args"\s*:\s*"$/m) === -1) {
            return undefined;
          }

          // keybinding "args" completion
					if ((linePrefix.search(/"args"\s*:\s*"$/) !== -1) && (prevLine.search(/"command"\s*:\s*"launches\./) !== -1)) {
						return [
							makeCompletionItem('start', position),
							makeCompletionItem('stop', position),
							makeCompletionItem('stop/start', position),
							makeCompletionItem('restart', position)
						];
					}

          // "command": "launches." completion
          if (linePrefix.search(/"command": "launches\./) !== -1) {
            
						const launches = vscode.workspace.getConfiguration("launches");

            // get launch configs direct from .vscode/launch.json or settings launch
            // const launchesSettingsArray = vscode.workspace.getConfiguration("launch").get('configurations');
            // const launchesSettingsCompoundArray = vscode.workspace.getConfiguration("launch").get('compounds');

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
      provideCompletionItems(document, position) {

            // "launches": {
            //   "RunNodeCurrentFile": "Launch File (workspaceFolderName1)",
            //   "RunCompound1": "Launch file and start chrome (workspaceFolderName2)"
            //   "someName": "<name> (<workspaceFolder.name>)" <== completions here
            // },

        // get all text until the current `position` and check if it reads `:\s*"$` before the cursor
        const linePrefix = document.lineAt(position).text.substring(0, position.character);

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
          if (typeof nameArray[item] === 'object') {
            // continue;
          }
          else if (typeof nameArray[item] === 'string') {
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
 * build an array of all config/compound launch names
 *
 * @param {readonly vscode.WorkspaceFolder[] | undefined} workSpaceFolders - an array
 * @returns {Array<string>} nameArray
 */
function getLaunchConfigNameArray (workSpaceFolders) {

  /** @type { Array<string> }*/
  let nameArray = [];
  
  if (workSpaceFolders) {
    
    workSpaceFolders.forEach((workSpace) => {

      // const launchConfigs = vscode.workspace.getConfiguration('launch', workSpace.uri);
      const launchConfigs = utilities.getAllConfigurations();
      // need this now?  TODO
      // const fromUserSettingsOnly = utilities.fromUserSettingsOnly();  // **only** user settings configs
      
      Object.entries(launchConfigs).forEach(value => {
        // @ts-ignore  noImplicitAny error
        if (value[0] === 'workspaceValue') value[1].forEach(config  => {
          return nameArray.push(`${ config.name }  (${ workSpace.name })`);
        });
        // @ts-ignore  noImplicitAny error
        else if (value[0] === 'globalValue') value[1].forEach(config => {
          return nameArray.push(`${ config.name }  (${ workSpace.name }) [Settings]`);
        });
      });
    });
  }
  return nameArray;
}


/**
 * from a string input make a CompletionItemKind.Text
 *
 * @param {string} key
 * @param {vscode.Position} position
 * @returns {vscode.CompletionItem} - CompletionItemKind.Text
 */
function makeCompletionItem(key, position) {

  let item;
  
  item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
  item.range = new vscode.Range(position, position);

  let setting = utilities.parseConfigurationName(key);
  item.sortText = setting.folder;
  
  if (setting?.setting)
    item.documentation = new vscode.MarkdownString(`This launch configuration is in the global user settings.`);
  else 
    item.documentation = new vscode.MarkdownString(`This launch configuration is in the workspace: **${ setting.folder }**`);
  
    // TODO : do something because of [Setting]?
    // remove spaces added to align folders in completionProvider
    // let stripSpaces = /(\s{2,})(\([^)]+\))$/g;
    // item.insertText = key.replace(stripSpaces, ' $2');

  return item;
}

exports.getLaunchConfigNameArray = getLaunchConfigNameArray;