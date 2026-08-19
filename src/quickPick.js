const vscode = require('vscode');
const configs = require('./configs');
const launch = require('./launch');

/** @import { QPItemWithData } from "./types" */


/**
 * 
 * @param { Set<vscode.DebugSession> } debugSessions 
 * @returns 
 */
exports.setUpQuickPick = async function (debugSessions) {
  
  // Map<"name", config>
  let nameMap = await configs.getLaunchConfigNameMap();
  const qpItemArray = configs.makeQPItemArray(nameMap);
  if (qpItemArray.length === 0) return;
  
  const qp = vscode.window.createQuickPick();
  qp.items = qpItemArray;
  qp.canSelectMany = true;
  qp.placeholder = "Select launch configuration(s) to run";
  qp.show();

  qp.onDidHide(() => qp.dispose());

  qp.onDidAccept(() => {

    /**
     * @readonly
     * @type { QPItemWithData[] }
    */
    // @ts-ignore
    const selectedItems = (qp.selectedItems.length) ? qp.selectedItems :  qp.activeItems;  // if no selectedItems use activeItems

    // const selectedItemsStrings = selectedItems.map(item => {
    //   return `${item.label} ${item.description}`;
    // });

    // arrow down/up to go to a line item
    if (selectedItems.length) {  // space to select - like clicking the checkbox
      if (selectedItems.length > 1) {
        // launch.launchArrayOfConfigs(selectedItemsStrings, '', debugSessions);  // if multiple selections: array
        launch.launchArrayOfConfigs(selectedItems, '', debugSessions);  // if multiple selections: array
      }
      // else launch.launchSelectedConfig(selectedItemsStrings[0], '', debugSessions);  // if only one config selected = string
      else launch.launchSelectedConfig(selectedItems[0], '', debugSessions);  // if only one config selected = string
    }

    qp.hide();
  });
};

