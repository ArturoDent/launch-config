const vscode = require('vscode');
const handleDebugSession = require('./handleDebugSession');
const utilities = require('./utilities');


/**
 * @description - get 'launches' seting and registerCommands for them
 *
 * @param {vscode.ExtensionContext} context
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 * @returns - nothing
 */
exports.loadLaunchSettings = function (context, disposables, debugSessions) {

        // load the 'launches' settings
              // "launches": {
              //    "RunNodeCurrentFile": "Launch File (workspaceFolderName)",
              //    "RunCompound1": "Launch file and start chrome"
              // },

  const launches = vscode.workspace.getConfiguration("launches");

  // look at each 'launches' setting
  for (const name in launches) {
    if ((typeof launches[name] !== 'string') && (!Array.isArray(launches[name]))) {
        continue;
    }

    let disposable;

    // register each one as a command
    // launches[name] === "Launch File (Project A Folder)" or ["Launch File (BuildSACC)"]
    // `launches.${name}` === "launches.RunNodeCurrentFile" or "launches.RunAsArray"

    if (Array.isArray(launches[name])) {
      disposable = vscode.commands.registerCommand(`launches.${ name }`, (arg) => {
        this.launchArrayOfConfigs(launches[name], arg, debugSessions);
      });
    }
    else {
      disposable = vscode.commands.registerCommand(`launches.${ name }`, async (arg) => {

        // when started by a task, arg = :

        // [
        //  "${command:launches.test-debug}",
        //  "C:\\Users\\Mark\\OneDrive\\TestMultiRoot",
        // ]

        this.launchSelectedConfig(launches[name], arg, debugSessions);
      });
    }

    context.subscriptions.push(disposable);
    disposables.push(disposable);
  }
}


/**
 * @description - start debug sessions for the array of the named launch configurations
 *
 * @param {Array} nameArray - an array of config names to run simultaneously
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
exports.launchArrayOfConfigs = async function (nameArray, arg, debugSessions) {
  nameArray.forEach(async name => await this.launchSelectedConfig(name, arg, debugSessions));
}


/**
 * @description - start a debug session of the named launch configuration
 *
 * @param {string} name - the 'name' key of one launch configuration/compound
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
exports.launchSelectedConfig = async function (name, arg, debugSessions) {

  // name = "Launch Build.js (Project A Folder)"

  const regex = /^(.+?)\s+\(([^)]*)\)$|^(.*)$/m;
      // eslint-disable-next-line no-unused-vars
  let [fullString, configName, folderName, configNameNoFolder] = name.match(regex);

  // if already running, check setting: launches.ifDebugSessionRunning and decide how to handle
  const runningSession = handleDebugSession.isMatchingDebugSession(debugSessions, name);

  if (runningSession.match) {
    let handleStart;
    if (!Array.isArray(arg)) handleStart = arg;
    else handleStart = handleDebugSession.getStopStartSetting();

    if (handleStart === "restart") handleDebugSession.restart(runningSession.session);
    else if (handleStart === "stop/start") handleDebugSession.stopStart(runningSession.session, name);
    else handleDebugSession.stop(runningSession.session);

    return;
  }

  let ConfigWorkSpaceFolder;

  if (folderName === 'code-wordspace') await vscode.debug.startDebugging(undefined, configName);
  else {
    // check if folderName is empty, if so use the  workSpaceFolder of the active editor
    if (!folderName) ConfigWorkSpaceFolder = utilities.getActiveWorkspaceFolder();
    else ConfigWorkSpaceFolder = vscode.workspace.workspaceFolders.find(ws => ws.name === folderName);

    configName = configName ? configName : configNameNoFolder;
    vscode.debug.startDebugging(ConfigWorkSpaceFolder, configName);
  }
}