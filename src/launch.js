const vscode = require('vscode');
const handleDebugSession = require('./handleDebugSession');
const utilities = require('./utilities');


/**
 * Get 'launches' setting and registerCommands for them
 *
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Disposable[]} disposables
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
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
        launchArrayOfConfigs(launches[name], arg, debugSessions);
      });
    }
    else {
      disposable = vscode.commands.registerCommand(`launches.${ name }`, (arg) => {

        // when started by a task, arg :
        // [
        //  "${command:launches.test-debug}",
        //  "C:\\Users\\Mark\\OneDrive\\TestMultiRoot",
        // ]

        launchSelectedConfig(launches[name], arg, debugSessions);
      });
    }
    context.subscriptions.push(disposable);
    disposables.push(disposable);
  }
}


/**
 * Start debug sessions for the array of the named launch configurations
 *
 * @param {Array<string>} nameArray - an array of config names to run simultaneously
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
async function launchArrayOfConfigs (nameArray, arg, debugSessions) {
  nameArray.forEach(async name => await launchSelectedConfig(name, arg, debugSessions));
}


/**
 * Start a debug session of the named launch configuration
 *
 * @param {string} name - the 'name' key of one launch configuration/compound
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
async function launchSelectedConfig (name, arg, debugSessions) {

  let handleStart;

  /** @type { string[] }*/
  let isCompoundConfig = [];

  let compoundSessionsMatch;
  let runningSession;

  if (debugSessions.size) {
    if (!Array.isArray(arg) && arg) handleStart = arg;           // if arg is an array it was from a task arg
    else handleStart = handleDebugSession.getStopStartSetting(); // will change if task args are introduced

    isCompoundConfig = isCompound(name);
    if (isCompoundConfig.length)
      compoundSessionsMatch = handleDebugSession.isMatchingCompoundDebugSessions(debugSessions, isCompoundConfig);
    else
      runningSession = handleDebugSession.isMatchingDebugSession(debugSessions, name);
  }

              // @ts-ignore
              // a compound config and there is an already running matching session
  if (compoundSessionsMatch?.length) {

    if (handleStart === "start") {
      await startLaunch(name);
    }
                 // no other way to handle restarts of a compound configuration unfortunately
    else if (handleStart === "stop/start" || handleStart === "restart") {
      compoundSessionsMatch.forEach(runningSession => {
        handleDebugSession.stop(runningSession);
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await startLaunch(name);
    }
    // else  (handleStart === "stop") {
    else  {     // so "stop" is effectively the default
      compoundSessionsMatch.forEach(runningSession => {
        handleDebugSession.stop(runningSession);
      });
    }
  }
              // not a compound config but there is a already running matching session
  else if (runningSession?.match && runningSession.session) {
      if (handleStart === "start") startLaunch(name);
      else if (handleStart === "restart") handleDebugSession.restart(runningSession.session);
      else if (handleStart === "stop/start") handleDebugSession.stopStart(runningSession.session, name);
      else handleDebugSession.stop(runningSession.session);  // handleStart === "stop", so the default
  }

  else await startLaunch(name);
};


/**
 * startDebugging the launch name
 * @param {string} name
 */
async function startLaunch(name)  {

  // name = "Launch Build.js (Project A Folder)"
  // name = "Launch Build.js"

  let setting = utilities.parseConfigurationName(name);

  if (setting.folder === 'code-workspace') vscode.debug.startDebugging(undefined, setting.config);
  else {

    // check if folderName is empty, if so use the  workSpaceFolder of the active editor
    let workspace = setting.folder
      ? vscode.workspace.workspaceFolders?.find(ws => ws.name === setting.folder)
      : utilities.getActiveWorkspaceFolder();

    await vscode.debug.startDebugging(workspace, setting.config);
    // vscode.commands.executeCommand('workbench.debug.action.focusCallStackView');  // remove when v1.54 released
  }
}



/**
 * The name configuration a compound configuration
 * @param {string} name
 * @returns {string[]}
 */
function isCompound(name) {

  // name: "Start 2 node debuggers (Test Bed)"
  // compoundArray[0].configuration : [ "First Debugger", "Second Debugger" ]

  // "compounds": [
  //   {
  //     "name": "Start 2 node debuggers",
  //     "configurations": ["First Debugger", "Second Debugger"],
  //     "stopAll": true
  //   }
  // ]

  let parsedName = utilities.parseConfigurationName(name);
  let workSpaceFolders = vscode.workspace.workspaceFolders;
  let match;

  if (workSpaceFolders) {
    workSpaceFolders.forEach((workSpace) => {

      let launchConfigs = vscode.workspace.getConfiguration('launch', workSpace.uri);
      let compoundArray = launchConfigs.get('compounds');

      compoundArray.forEach(( /** @type {{ name: string | any[]; }} */ config) => {

        // check for a compound without a workspaceFolder name
        if (config.name === parsedName.config && (
          !parsedName.folder || name === parsedName.fullName))      // overkill?
          match = config;
      });
    })
  }

  // "Start2DebuggersWS": ["First Debugger (Test Bed)", "Second Debugger (Test Bed)"],

  if (match) {
  // @ts-ignore
    return match.configurations.map(name => `${name}  (${parsedName.folder})`);
  }
  else return [];
}

exports.launchSelectedConfig = launchSelectedConfig;
exports.launchArrayOfConfigs = launchArrayOfConfigs;
exports.isCompound = isCompound;