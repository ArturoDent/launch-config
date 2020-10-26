const vscode = require('vscode');
const retrieve = require('./getLaunchConfigsAndSettings');
const run = require('./triggerLaunchDebug');


/**
 * @desc - fetch launch configuration user setting
 * @desc - get matching launch.json configuration
 * @desc - run/launch debug originally triggered with a keybinding
 * 
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('launch-config.launchConfig', async function () {

    // get all the launch.json configurations
    let configs = await retrieve.getLaunchConfigurations();

    // get the user's setting for which config to run/debug
    let settingsLaunchConfigName = await retrieve.extensionLaunchSetting();

    // match the user setting: 'runLaunchConfiguration.name' to launch.json configurations 'name's
    if (settingsLaunchConfigName) {
      let found = await retrieve.findSelectedLaunchFromConfigs(configs, settingsLaunchConfigName);
      await run.config(found);
    }
    else return;

    // Open the debug view?  Check user setting: 'openDebug', default true
    let settingsOpenDebug = await retrieve.extensionOpenDebugSetting();
    if (settingsOpenDebug) await run.openDebugView();
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
