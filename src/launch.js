const vscode = require('vscode');
// const { getLaunchConfigNameArray } = require('./completionProviders');
const handleDebugSession = require('./handleDebugSession');
const utilities = require('./utilities');


/**
 * @description - get 'launches' setting and registerCommands for them
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
      disposable = vscode.commands.registerCommand(`launches.${ name }`, async (arg) => {

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
 * @description - start debug sessions for the array of the named launch configurations
 *
 * @param {Array<string>} nameArray - an array of config names to run simultaneously
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
async function launchArrayOfConfigs (nameArray, arg, debugSessions) {
  nameArray.forEach(async name => await launchSelectedConfig(name, arg, debugSessions));
}


/**
 * @description - start a debug session of the named launch configuration
 *
 * @param {string} name - the 'name' key of one launch configuration/compound
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
async function launchSelectedConfig (name, arg, debugSessions) {

  // check if a compound configuration
  if (debugSessions.size) {
    const isCompoundConfig = isCompound(name);  // returns an array of the configs or null
    if (isCompoundConfig) {
      launchArrayOfConfigs(isCompoundConfig, arg, debugSessions);
      return;
    }
  }

  if (debugSessions.size) {
    // if already running, check setting: launches.ifDebugSessionRunning and decide how to handle
    const runningSession = handleDebugSession.isMatchingDebugSession(debugSessions, name);

    if (runningSession.match) {
      let handleStart;
      if (!Array.isArray(arg)) handleStart = arg;
      else handleStart = handleDebugSession.getStopStartSetting();

      if (runningSession.session) {
        if (handleStart === "restart") handleDebugSession.restart(runningSession.session);
        else if (handleStart === "stop/start") handleDebugSession.stopStart(runningSession.session, name);
        else handleDebugSession.stop(runningSession.session);  // handleStart === "stop"
      }
      return;
    }
  }

  // name = "Launch Build.js (Project A Folder)"
  // name = "Launch Build.js"

  let setting = utilities.parseConfigurationName(name);

  if (setting.folder === 'code-workspace') vscode.debug.startDebugging(undefined, setting.config);
  else {
    // check if folderName is empty, if so use the  workSpaceFolder of the active editor

    let workspace = setting.folder
      ? vscode.workspace.workspaceFolders?.find(ws => ws.name === setting.folder)
      : utilities.getActiveWorkspaceFolder();

    // let workspace;
    // if (setting.folder && vscode.workspace.workspaceFolders)
    //   workspace = vscode.workspace.workspaceFolders.find(ws => ws.name === setting.folder);
    // else workspace = utilities.getActiveWorkspaceFolder();

    await vscode.debug.startDebugging(workspace, setting.config);
    // vscode.commands.executeCommand('workbench.debug.action.focusCallStackView');
  }
};

/**
 * @description - is the name configuration a compound configuration
 * @param {string} name 
 * @returns { string[] | null}
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

  /**
   * @typedef  { Object } match
   * @property { string } name
   * @property { Array<string> } configurations
  */
  let match;

  if (workSpaceFolders) {
    workSpaceFolders.forEach((workSpace) => {

      let launchConfigs = vscode.workspace.getConfiguration('launch', workSpace.uri);
      let compoundArray = launchConfigs.get('compounds');

      compoundArray.forEach(( /** @type {{ name: string | any[]; }} */ config) => {

        // check for a compound without a workspaceFolder name
        if (config.name === parsedName.config && (
          !parsedName.folder || name === parsedName.fullName))      // overkill really 
          match = config;
      });
    })
  }

  // @ts-ignore
  if (match) return match.configurations;
  else return null;

  // return match;
  // return compoundArray;

    // compoundArray.forEach(( /** @type {{ name: string | any[]; }} */ compound) => {
      
    // });

}

exports.launchSelectedConfig = launchSelectedConfig;
exports.launchArrayOfConfigs = launchArrayOfConfigs;