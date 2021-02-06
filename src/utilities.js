const vscode = require('vscode');

/**
 * @description - if multiple WorkSpaceFolders in the WorkSpace
 * @returns {vscode.WorkspaceFolder} - the WorkSpaceFolder of the currently active file
 */
exports.getActiveWorkspaceFolder  = function()  {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders)  vscode.window.showErrorMessage('There is no workspacefolder open.')
  return vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
<<<<<<< Updated upstream
};
=======
};

/**
 * @description - regex parse the configuration name into its components
 *
 * @param {string} name - launch configuration.name + (workspaceFolder)
 * @returns {Object} {name, folder, configName}
 */
exports.parseConfigurationName = function (name) {

  // Launch File (TestMultiRoot)
  // Launch File                          <== no workspace folder is allowed

  const regex = /^(.+?)\s+\(([^)]+)\)$|^(.+)$/m;

  let [fullString, configName, folderName, configNameNoFolder] = name.match(regex);

  return {
    fullName: fullString,
    folder: folderName,
    config: configName ? configName : configNameNoFolder
  }
}
>>>>>>> Stashed changes
