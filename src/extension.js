const vscode = require('vscode');
const settings = require('./settings');


/**
 * @desc - fetch launch configuration user setting
 * @desc - get matching launch.json configuration
 * @desc - run/launch debug originally triggered with a keybinding
 * 
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('launch-config.launchConfig', async function () {

    // get the user's setting for which config to run/debug
    let settingsLaunchConfigName = settings.getExtensionLaunchSetting();
    if (!settingsLaunchConfigName) {
      await vscode.window.showInformationMessage(`There is no 'launch-config.runLaunchConfiguration' setting.`);
    }
    else {
      let thisWorkspace = vscode.workspace.workspaceFolders[0];
      vscode.debug.startDebugging(thisWorkspace, settingsLaunchConfigName);
    }
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
