const vscode = require('vscode');

/**
 * @description - if multiple WorkSpaceFolders in the WorkSpace
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
 * @description - regex parse the configuration name into its components
 *
 * @param {string} name - launch configuration.name + (workspaceFolder)
 *
 * @typedef  {Object} Setting
 * @property {string} fullName - 'launch config name (workspaceFolderName)'
 * @property {string} folder - 'workspaceFolderName'
 * @property {string} config - 'launch config name'
 *
 * @returns {Setting}
 */
exports.parseConfigurationName = function (name) {

  // Launch File (TestMultiRoot)
  // Launch File                          <== no workspace folder is allowed

  const regex = /^(?<configName>.+?)\s+\((?<folderName>[^)]+)\)$|^(?<configNameNoFolder>.+)$/m;

  let match = name.match(regex);

  if  (match?.groups) {
    return {
      fullName: match[0],
      folder: match.groups.folderName,
      config: match.groups.configName ? match.groups.configName : match.groups.configNameNoFolder
    };
  }
  else
    return {
      fullName: name,
      folder: '',
      config: ''
    };
}