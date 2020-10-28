const vscode = require('vscode');


// ***********************  Open Run/Debug Setting  *******************************************

/**
 * @desc - get this extension's 'runLaunchConfiguration' setting
 * @returns - string -  value of the 'name' key of the user's 'runLaunchConfiguration' setting
 */
exports.getExtensionLaunchSetting = function()  {

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
 * @desc - get this extension's 'OpenDebug' setting
 * @returns - string -  value of the 'name' key of the user's 'runLaunchConfiguration' setting
 */
exports.getExtensionOpenDebugSetting = function()  {
  const settings = vscode.workspace.getConfiguration("launch-config");
  let shouldOpenDebugView = settings.get('openDebug');
  return shouldOpenDebugView;
};