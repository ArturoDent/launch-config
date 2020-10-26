const vscode = require('vscode');

/**
 * @desc - get the 'configuration' array from launch.json
 * @returns - array - of launch configurations 
 */
exports.getLaunchConfigurations = async function () {

  // get the launch.json file, must use JSON5 or similar under the hood
  // const config = vscode.workspace.getConfiguration('launch', vscode.workspace.workspaceFolders[0].uri);
  const config = vscode.workspace.getConfiguration('launch');

  // get the configurations (an array <of objects>) from launch.json
  return config.get('configurations');
};

/**
 * @desc - get this extension's 'runLaunchConfiguration' setting
 * @returns - string -  value of the 'name' key of the user's 'runLaunchConfiguration' setting
 */
exports.extensionLaunchSetting = async function()  {

  const settings = vscode.workspace.getConfiguration("launch-config");

  // if the setting is the default value from package.json
  // i.e., there is no user setting
  if (settings.get('runLaunchConfiguration').name !== "config 'name' to run here") 
    return settings.get('runLaunchConfiguration').name;

  else {
    vscode.window.showErrorMessage('There is no launch-config.runLaunchConfiguration setting using the "name" property.')
    return false;
  }
};

/**
 * @desc - get the launch.json config that matches the 'name' of the setting
 * 
 * @param {Array} configs - all the launch.json configurations
 * @param {string} chosenConfigName - the settings 'name' of a configuration
 * @returns - the configuration with the matching 'name' value
 */
exports.findSelectedLaunchFromConfigs = async function(configs, chosenConfigName)  {
  return configs.find(element => element.name === chosenConfigName);
};


// ***********************  Open Run/Debug Setting  *******************************************


/**
 * @desc - get this extension's 'OpenDebug' setting
 * @returns - string -  value of the 'name' key of the user's 'runLaunchConfiguration' setting
 */
exports.extensionOpenDebugSetting = async function()  {
  const settings = vscode.workspace.getConfiguration("launch-config");
  let shouldOpenDebugView = settings.get('openDebug');
  return shouldOpenDebugView;
};