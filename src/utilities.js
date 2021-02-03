const vscode = require('vscode');

/**
 * @description - if multiple WorkSpaceFolders in the WorkSpace
 * @returns {vscode.WorkspaceFolder} - the WorkSpaceFolder of the currently active file
 */
exports.getActiveWorkspaceFolder  = function()  {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders)  vscode.window.showErrorMessage('There is no workspacefolder open.')
  return vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
};

exports.parseConfigurationName = function(name) {
  const regex = /^(.+?)\s+\(([^)]*)\)$|^(.*)$/m;

  // eslint-disable-next-line no-unused-vars
  let [fullString, configName, folderName, configNameNoFolder] = name.match(regex);
  return {
    fullName: fullString,
    folder: folderName,
    config: configName ?? configNameNoFolder
  }
}