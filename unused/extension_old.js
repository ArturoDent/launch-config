const vscode = require('vscode');
const configs = require('./configs');
const compounds = require('./compounds');
const settings = require('./settings');
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

    // get the user's setting for which config to run/debug
    let settingsLaunchConfigName = settings.getExtensionLaunchSetting();
    if (!settingsLaunchConfigName) {
      await vscode.window.showInformationMessage(`There is no 'launch-config.runLaunchConfiguration' setting.`);
      return;
    }
    // else {
    //   let thisWorkspace = vscode.workspace.workspaceFolders[0];
    //   vscode.debug.startDebugging(thisWorkspace, "Compound 1");
    //   return;
    // }

    // get compound configurations in launch.json if any, return false if none, array if >= 1
    let launchCompounds = compounds.checkForCompoundConfigurations();

    // what if user names a compound and a configuration??

    // get all the launch.json configurations
    let launchConfigs = configs.getLaunchConfigurations();
    if (!launchConfigs) {
      await vscode.window.showInformationMessage(`There are no launch.json configurations.`);
      return;
    }

    // check if settingsLaunchConfigName is one of the compounds
    // if (launchCompounds && launchConfigs && settingsLaunchConfigName) {
    if (launchCompounds) {

      let found = compounds.findSelectedLaunchFromCompounds(launchCompounds, settingsLaunchConfigName);

      if (found)  {

        // ensure that all configs within this found compound are in the launch.json configs
        // if missing any do not run anything
        let allExist = compounds.checkAllCompoundConfigsExist(found.configurations, launchConfigs);

        //  get each configuration and run
        if (allExist) {
          let configsArray = compounds.getCompoundConfigurations(found.configurations, launchConfigs);
          configsArray.forEach(element => run.config(element));

          // let launchCompounds = compounds.checkForCompoundStopAll();

          return;
        }
        else {
          await vscode.window.showInformationMessage(`Missing at least one configuration listed in the launch.json 'compounds'.`);
          return;
        }
      }
    }

    // below is looking in launch.json 'configurations', not its 'compounds'

    // match the user setting: 'runLaunchConfiguration.name' to launch.json configurations 'name's
    // if (settingsLaunchConfigName) {
    let found = configs.findSelectedLaunchFromConfigs(launchConfigs, settingsLaunchConfigName);
    if (found) run.config(found);
    else {
      await vscode.window.showInformationMessage(`Could not find the setting launch 'name' in launch.json.`);
      return;
    }

    // Open the debug view?  Check user setting: 'openDebug', default true
    let settingsOpenDebug = settings.getExtensionOpenDebugSetting();
    if (settingsOpenDebug) run.openDebugView();
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
