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

  const regex = /^(.+?)\s+\(([^)]*)\)$|^(.*)$/m;
  // eslint-disable-next-line no-unused-vars
  let [fullString, configName, folderName, configNameNoFolder] = name.match(regex);

  let ConfigWorkSpaceFolder;

  if (folderName === 'code-wordspace') vscode.debug.startDebugging(undefined, configName);
  else {
    // check if folderName is empty, if so use the  workSpaceFolder of the active editor
    if (!folderName) ConfigWorkSpaceFolder = utilities.getActiveWorkspaceFolder();
    else ConfigWorkSpaceFolder = vscode.workspace.workspaceFolders.find(ws => ws.name === folderName);

    configName = configName ? configName : configNameNoFolder;
    await vscode.debug.startDebugging(ConfigWorkSpaceFolder, configName);
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

  let folderName = name.replace(/.*\(([\w\s]*)\)/, '$1');
  let launchName = name.replace(/^(.*?)\s*\(.*\)$/m, '$1');

  debugSessions.forEach(session => {
    if (session.name.replace(/(.*):.*$/m, '$1') === launchName && session.workspaceFolder.name === folderName) {
      match = true;
      matchSession = session;
    }
  })

  return { match: match, session: matchSession };
}


/**
 * @description - get the value of the "launch.ifDebugSessionRunning" setting
 * @returns {string} - "stop" or "stop/start" or "restart"
 */
exports.getStopStartSetting = function () {
  return vscode.workspace.getConfiguration().get("launch.ifDebugSessionRunning");
}
