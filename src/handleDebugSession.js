const vscode = require('vscode');
const utilities = require('./utilities');


/**
 * @description - restart the indicated debugSession
 * @param {vscode.DebugSession} session
 */
exports.restart = async function (session) {
  vscode.commands.executeCommand('workbench.action.debug.restart', '', { sessionId: session.id } );
}


/**
 * @description - stop and then start the indicated debugSession
 *
 * @param {vscode.DebugSession} session
 * @param {string} name - launch configuration.name + (workspaceFolder)
 */
exports.stopStart = async function (session, name) {

  await vscode.debug.stopDebugging(session);


  let setting = utilities.parseConfigurationName(name);

  if (setting.folder === 'code-workspace') vscode.debug.startDebugging(undefined, setting.config);
  else {
    // check if folderName is empty, if so use the  workSpaceFolder of the active editor
    let workspace = setting.folder
      ? vscode.workspace.workspaceFolders.find(ws => ws.name === setting.folder)
      : utilities.getActiveWorkspaceFolder();

    await vscode.debug.startDebugging(workspace, setting.config);
    vscode.commands.executeCommand('workbench.debug.action.focusCallStackView');
  }
}


/**
 * @description - stop the indicated debugSession
 * @param {vscode.DebugSession} session
 */
exports.stop = async function (session) {
  vscode.debug.stopDebugging(session);
}


/**
 * @description - is there a vscode.DebugSession that has the same launch configuration.name and same workspaceFolder
 * @description - in the Set of debugSessions
 *
 * @param {Set<vscode.DebugSession>} debugSessions
 * @param {string} name - launch configuration.name + (workspaceFolder)
 *
 * @typedef  {Object} MatchObject
 * @property {boolean} match - is there a matching debugSession
 * @property {vscode.DebugSession} session - null or the debugSession in debugSessions Set that matches the running debugSession
 *
 * @returns {MatchObject}
 */
exports.isMatchingDebugSession = function (debugSessions, name) {

  // name = "Launch Build.js (Project A Folder)"

  let match = false;
  let matchSession = null;

  if (!debugSessions.size) return { match:match, session:matchSession};

  let setting = utilities.parseConfigurationName(name);

  debugSessions.forEach(session => {
    if (session.name.replace(/(.*):.*$/m, '$1') === setting.config
      && !setting.folder || setting.folder === session.workspaceFolder.name ) {
      match = true;
      matchSession = session;
    }
  })

  return { match: match, session: matchSession };
}


/**
 * @description - get the value of the "launches.ifDebugSessionRunning" setting
 * @returns {string} - "stop" or "stop/start" or "restart"
 */
exports.getStopStartSetting = function () {
  return vscode.workspace.getConfiguration().get("launches.ifDebugSessionRunning");
}
