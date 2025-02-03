const vscode = require('vscode');

/**
 * If multiple WorkSpaceFolders in the WorkSpace
 * @returns {vscode.WorkspaceFolder | undefined} - the WorkSpaceFolder of the currently active file
 */
exports.getActiveWorkspaceFolder  = function()  {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) vscode.window.showErrorMessage('There is no workspacefolder open.');

  if (vscode.window.activeTextEditor)
    return vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
  else return undefined;
};


/**
 * Are the launch configurations from user settings only?
 * @returns {boolean} - true: from user settings
 */
exports.fromUserSettingsOnly = function () {

  const launchConfigs = vscode.workspace.getConfiguration('launch');
  const merged = launchConfigs.inspect('configurations');
  if (merged?.globalValue && !merged.workspaceValue && !merged.workspaceFolderValue) return true;
  else return false;
};

/**
 * Get the User Setting launch config that matches the config name from "launches" setting
 * 
 * @param {string} configName - from the chosen "launches" setting
 * @returns {vscode.DebugConfiguration | null}
 */
exports.getUserSettingConfiguration = function (configName) {

  const launchConfigs = vscode.workspace.getConfiguration('launch');
  const mergedConfigs = launchConfigs.inspect('configurations');
  const mergedCompounds = launchConfigs.inspect('compounds');

  // get the merged.globalValue[n].name that matches config.name
  let config2run = Object.values(mergedConfigs?.globalValue).filter(each => each.name === configName);
  if (config2run.length) return config2run[0];

  if (!config2run.length) config2run = Object.values(mergedCompounds?.globalValue).filter(each => each.name === configName);
  if (config2run) vscode.window.showErrorMessage("Cannot use `compound` configurations from user settings.", { modal: false });
  if (!config2run) vscode.window.showErrorMessage("Could not find a matching configuration in user settings.", { modal: false });

  return null;
};


/**
 * Regex parse the configuration name into its components
 *
 * @param {string} name - launch configuration.name + (workspaceFolder)
 *
 * @typedef  {Object} Setting
 * @property {string}   fullName - 'launch config name (workspaceFolderName)'
 * @property {string}   folder - 'workspaceFolderName'
 * @property {string}   name - 'launch config name'* @property {string} name - 'launch config name'
 * @property {boolean}  setting - config from user setting? *
 * @returns {Setting}
 */
exports.parseConfigurationName = function (name) {

  // Launch File (TestMultiRoot)
  // Launch File                          <== no workspace folder is allowed

  // const regex = /^(?<configName>.+?)\s+\((?<folderName>[^)]+)\)$|^(?<configNameNoFolder>.+)$/m;
  const regex = /(?<configName>.+?)\s*\((?<folderName>[^)]+)\)?\s*\[?(?<settings>Settings)?\]?|(?<configNameNoFolder>.+)/;

  let match = name.match(regex);

  if  (match?.groups) {
    return {
      fullName: match[0],
      folder: match.groups.folderName,
      // config: match.groups.configName ? match.groups.configName : match.groups.configNameNoFolder
      name: match.groups.configName ? match.groups.configName : match.groups.configNameNoFolder,
      setting: match.groups.settings ? true : false
    };
  }
  else
    return {
      fullName: name,
      folder: '',
      // config: ''
      name: '',
      setting: false
    };
};

/**
 * Get the User Setting launch config that matches the config name from "launches" setting
 * 
 * @returns {Object} configArray
 */
exports.getAllConfigurations = function () {

  let returnObject = {};
  const launchConfigs = vscode.workspace.getConfiguration('launch');

  const allValues = launchConfigs.inspect('configurations');
  const allCompounds = launchConfigs.inspect('compounds');
  let allConfigs = launchConfigs.configurations;
  if (!allConfigs) vscode.window.showErrorMessage('Could not find any launch configurations.');

  // TODO: what if there is an empty 'compound' object
  if (!allValues?.globalValue) {
    if (launchConfigs.compounds) allConfigs = allConfigs.concat(launchConfigs.compounds);
    returnObject.workspaceValue = allConfigs;
  }

  else if (allValues?.globalValue && allValues.workspaceValue) {
    let settingsConfigs;

    if (allCompounds?.workspaceValue) allConfigs = allConfigs.concat(launchConfigs.compounds);
    returnObject.workspaceValue = allConfigs;

    if (allValues?.globalValue) settingsConfigs = allValues?.globalValue;
    // if (allCompounds?.globalValue) settingsConfigs = settingsConfigs.concat(allCompounds.globalValue);
    if (allCompounds?.globalValue)
      vscode.window.showInformationMessage("Cannot use `compound` configurations from user settings. So any compound configurations in your user settings will not be shown as a possible completion.");
    returnObject.globalValue = settingsConfigs;
  }

  else if (allValues?.globalValue && !allValues.workspaceValue) {
    // if (allCompounds?.globalValue) allConfigs = allConfigs.concat(launchConfigs.compounds);
    if (allCompounds?.globalValue)
      vscode.window.showInformationMessage("Cannot use `compound` configurations from user settings. So any compound configurations in your user settings will not be shown as a possible completion.");
    returnObject.globalValue = allConfigs;
  }

  return returnObject;
};