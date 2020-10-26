const vscode = require('vscode');

/**
 * @desc - launch debug with the config object
 * 
 * @param {object} chosenConfig 
 */
exports.config = async function(chosenConfig)  {
  vscode.commands.executeCommand('debug.startFromConfig', chosenConfig);
};

/**
 * @desc - open the run/debug view if user setting set to true
 */
exports.openDebugView = async function()  {
  vscode.commands.executeCommand('workbench.view.debug');
};