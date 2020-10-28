const vscode = require('vscode');


// ***********************  Configs  *******************************************

/**
 * @desc - get the 'configuration' array from launch.json
 * @returns - array - of launch configurations 
 */
exports.getLaunchConfigurations = function () {

  // get the launch.json file, must use JSON5 or similar under the hood
  // const config = vscode.workspace.getConfiguration('launch', vscode.workspace.workspaceFolders[0].uri);
  const config = vscode.workspace.getConfiguration('launch');

  // get the configurations (an array <of objects>) from launch.json
  return config.get('configurations');
};


/**
 * @desc - get the launch.json config that matches the 'name' of the setting
 * 
 * @param {Array} configs - all the launch.json configurations
 * @param {string} chosenConfigName - the settings 'name' of a configuration
 * @returns - the configuration with the matching 'name' value, else 
 */
exports.findSelectedLaunchFromConfigs = function(configs, chosenConfigName)  {
  let foundConfig = configs.find(element => element.name === chosenConfigName);
  return foundConfig;
};




