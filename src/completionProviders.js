const vscode = require('vscode');
const utilities = require('./utilities');
const configs = require('./configs');


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

        let nameMap = await configs.getLaunchConfigNameMap();
        if (nameMap.size === 0) return [];  // return an empty array

        /** @type { vscode.CompletionItem[] } */
        let completionItemArray = [];
        
        nameMap.forEach((value, key) => {
          completionItemArray.push(makeCompletionItem(key));
        });

        return completionItemArray;
      }
    },
    '"'       // trigger intellisense/completion
  );

  context.subscriptions.push(settingsCompletionProvider);
}


/**
 * from a string input make a CompletionItemKind.Text
 *
 * @param {string} key
 * @returns {vscode.CompletionItem} - CompletionItemKind.Text
 */
function makeCompletionItem(key) {

  // this would have trouble if ) in wsName
  let stripSpaces = /(\s{2,})(\([^)]*)(?!.*\()|(\s{2,})(\[[^\]]*\])$/g;
  key = key.replace(stripSpaces, ' $2$4');
  
  let item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
  
  const pos = vscode.window.activeTextEditor?.selection.active;
  if (pos) item.range = new vscode.Range(pos, pos);
  
  //  https://stackoverflow.com/questions/60001714/custom-extension-for-json-completion-does-not-work-in-double-quotes
  // item.range = new vscode.Range(position, position);
  // it appears item.range = new vscode.Range(pos, pos); is still needed if select text between quotes and press Ctrl+Space

  let configInfo = utilities.parseConfigurationName(key);

  // sort by User Settings/code-workspace/workSpace settings.json/launch.json
  let sort = '';
  if (configInfo.setting === 'User Settings') sort = '01';
  else if (configInfo.setting === 'code-workspace') sort = '02';
  // else if (configInfo.setting === '.vscode/settings.json') sort = '03';
  else if (configInfo.setting === 'Folder Settings') sort = '03';
  else if (configInfo.setting === 'launch.json') {
    const index = vscode.workspace.workspaceFolders?.findIndex(ws => ws.name === configInfo.folder);
    sort = '04' + index;
  }
  
  item.sortText = sort;  
  item.detail = `from ${configInfo.setting}`;
  
  const configLocation = configInfo?.setting;
  
  if (configLocation) {
    if (configLocation === 'User Settings')
      item.documentation = new vscode.MarkdownString(`This launch configuration is in the global user settings.`);
    else if (configLocation === 'launch.json')
      item.documentation = new vscode.MarkdownString(`This launch configuration is in ${configInfo.folder}'s *launch.json*.`);
    else if (configLocation === 'code-workspace')
      item.documentation = new vscode.MarkdownString(`This launch configuration is in the *.code-workspace* settings.`);
    // else if (configLocation === '.vscode/settings.json')
    else if (configLocation === 'Folder Settings')
      item.documentation = new vscode.MarkdownString(`This launch configuration is a workspace setting located in *.vscode/settings.json*.`);
  }
  
  // this would have trouble if ) in wsName
  item.insertText = key.replace(stripSpaces, ' $2$4');

  return item;
}