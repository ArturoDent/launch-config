const vscode = require('vscode');
/** @import { RootNode } from "./types" */


/**
 * If multiple WorkSpaceFolders in the WorkSpace
 * @returns {vscode.WorkspaceFolder | undefined} - the WorkSpaceFolder of the currently active file
 */
exports.getActiveWorkspaceFolder  = function()  {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) vscode.window.showErrorMessage('There is no workspacefolder open.');

  if (vscode.window.activeTextEditor) {
    const wsURI = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
    if (wsURI) return wsURI;
  }
  
  if (folders) return folders[0];
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

  let config2run;
  // get the merged.globalValue[n].name that matches config.name
  if (mergedConfigs?.globalValue) {
    config2run = Object.values(mergedConfigs?.globalValue).filter(each => each.name === configName);
    if (config2run.length) return config2run[0];
  }
  if (mergedCompounds?.globalValue) {
    config2run = Object.values(mergedCompounds?.globalValue).filter(each => {
      return each.name === configName;
    });
    if (config2run.length) return config2run[0];
  }
  if (!config2run) vscode.window.showErrorMessage("Could not find a matching configuration in user settings.", {modal: false});

  return null;
};

/**
 * Get the launch config that matches the config name from "code-workspace" setting
 * @param {vscode.WorkspaceFolder} workspace - from the chosen "code-workspace" setting * 
 * @param {string} configName - from the chosen "code-workspace" setting
 * @returns {vscode.DebugConfiguration | null}
 */
exports.getCodeWorkspaceConfiguration = function (workspace, configName) {

  const launchConfigs = vscode.workspace.getConfiguration('launch', workspace.uri);
  const mergedConfigs = launchConfigs.inspect('configurations');
  const mergedCompounds = launchConfigs.inspect('compounds');

  let config2run;
  // get the merged.workspaceValue[n].name that matches the config.name
  if (mergedConfigs?.workspaceValue) {
    config2run = Object.values(mergedConfigs?.workspaceValue).filter(each => each.name === configName);
    if (config2run.length) return config2run[0];
  }
  // else look at workspaceFolderValue, which will have launch.json configs
  else if (mergedConfigs?.workspaceFolderValue) {
    config2run = Object.values(mergedConfigs?.workspaceFolderValue).filter(each => each.name === configName);
    if (config2run.length) return config2run[0];
  }

  // TODO cannot use compound configs from code-workspace or .vscode/settings.json?
  if (mergedCompounds?.workspaceValue) {
    config2run = Object.values(mergedCompounds?.workspaceValue).filter(each => {
      return each.name === configName;
    });
    if (config2run.length) return config2run[0];
  }
  if (!config2run) vscode.window.showErrorMessage("Could not find a matching configuration in .code-workspace file.", {modal: false});

  return null;
};

/**
 * 
 * @param {Map<string, RootNode> } wsRootNodes 
 * @param {string} configName - from the chosen "code-workspace" setting
 * @returns {Promise<vscode.DebugConfiguration | undefined>}
 */
exports.getWorkspaceSettingConfiguration = async function (wsRootNodes, configName) {
  
  for (const [, root] of wsRootNodes) {   // [wsName, root]

    const theConfig = root?.configurations?.find(el => el.name === configName);
    if (theConfig) return theConfig;
    // const theCompound = root?.compounds?.find(el => el.name === configName);
    // if (theCompound) return theCompound;
  }
  return undefined;
}

/**
 * 
 * @param {string} config 
 * @returns 
 */
exports.parseConfigurationToREGroups = function (config) {
  
  // const userSettingsRE = /^(?<configName>.+?)(\s*\((?<folderName>[^)]+)\))?\s*\[(?<settings>User Settings)\]$/m;
  const userSettingsRE = /^(?<configName>.+?)\s*\[(?<settings>User Settings)\]$/m;
  
  // const workspaceSettingsRE = /^(?<configName>.+?)\s*(\((?<folderName>[^)]+)\))?\s*\[(?<settings>\.vscode\/settings\.json)\]$/m;
  const workspaceSettingsRE = /^(?<configName>.+?)\s*(\((?<folderName>[^)]+)\))?\s*\[(?<settings>Folder Settings)\]$/m;
  // const workspaceSettingsRE = /^(?<configName>.+?)\s*\[(?<settings>\.vscode\/settings\.json)\]$/m;

  const codeWorkspaceSettingsRE = /^(?<configName>.+?)\s*(\((?<folderName>[^)]+)\))?\s*\[(?<settings>code-workspace)\]$/m;
  // const codeWorkspaceSettingsRE = /^(?<configName>.+?)\s*\[(?<settings>code-workspace)\]$/m;
  
  const launchJsonRE = /^(?<configName>.+?)\s*\((?<folderName>[^)]+)\)\s*\[(?<settings>launch.json)\]$/m;

  const match = config.match(userSettingsRE) || config.match(workspaceSettingsRE)
    || config.match(codeWorkspaceSettingsRE) || config.match(launchJsonRE);
  
  if (match) return match;
  else return undefined;
}


/**
 * Regex parse the configuration name into its components
 *
 * @param {string} name - launch configuration.name + (workspaceFolder)
 *
 * @typedef  {Object} Setting
 * @property {string}   fullName - 'launch config name (workspaceFolderName)'
 * @property {string}   folder - 'workspaceFolderName'
 * @property {string}   name - 'launch config name'
 * @property {string|undefined}  setting - config from user setting? *
 * @returns  {Setting}
 */
exports.parseConfigurationName = function (name) {

  // Launch File (TestMultiRoot)
  // Launch File                          <== no workspace folder is allowed

  let match = module.exports.parseConfigurationToREGroups(name);

  if (match?.groups) {
    const {configName, folderName, settings} = match?.groups;
    return {
      fullName: match[0],
      folder: folderName,
      // name: configName ? configName : configNameNoFolder,  // TODO
      name: configName,
      // setting: settings ? true : false
      setting: settings || undefined
    };
  }
  else
    return {
      fullName: name,
      folder: '',
      name: '',
      // setting: false
      setting: undefined
    };
};


/**
 * @description - does a running debugSession correspond to the given (already-parsed)
 * launch configuration name/folder
 *
 * @param {vscode.DebugSession} session
 * @param {string} configName
 * @param {string} [configFolder]
 * @returns {boolean}
 */
exports.sessionMatchesConfig = function (session, configName, configFolder) {
  if (!configName) return false;
  if (configFolder && configFolder !== session.workspaceFolder?.name) return false;

  // session.configuration.name is the original launch.json/compound-member "name",
  // unaffected by any adapter that renames the *display* session.name (e.g. Flutter
  // appending "(iPhone 14 Pro)" - the resolved configuration's name is untouched)
  if (session.configuration?.name) return session.configuration.name === configName;

  // fallback if configuration is ever unavailable: strip VS Code's own
  // "<compound>: <child>" colon-delimited session naming
  return session.name.replace(/(.*):.*$/m, '$1') === configName;
};