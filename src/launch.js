const vscode = require('vscode');
const handleDebugSession = require('./handleDebugSession');
const utilities = require('./utilities');
const configs = require('./configs');
const {getWorkspaceSettingsRootNodes} = require('./configs');

/** @import { Compound, Configuration, RootNode, QPItemWithData } from "./types" */



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

    // TODO: make keybinding also take a config name directly, no need for a matching launches entry
    if (Array.isArray(launches[name])) {
      disposable = vscode.commands.registerCommand(`launches.${name}`, async (arg) => {  // [...args]

        const resolved = await Promise.all(launches[name].map(async (/** @type {string} */ plainName) => {
          return { plainName, qpItem: await resolveLaunchesEntry(plainName) };
        }));

        const missing = resolved.filter(entry => !entry.qpItem).map(entry => entry.plainName);
        if (missing.length)
          vscode.window.showErrorMessage(`Could not find a matching launch configuration for: ${missing.join(', ')}`);

        // @ts-ignore  - already filtered out the missing (undefined) entries
        launchArrayOfConfigs(resolved.map(entry => entry.qpItem).filter(qpItem => qpItem), arg, debugSessions);
      });
    }
    else {
      disposable = vscode.commands.registerCommand(`launches.${name}`, async (arg) => {  // [...args]

        // when started by a task, arg :
        // [
        //  "${command:launches.test-debug}",
        //  "C:\\Users\\Mark\\OneDrive\\TestMultiRoot",
        // ]

        const qpItem = await resolveLaunchesEntry(launches[name]);
        if (!qpItem) {
          vscode.window.showErrorMessage(`Could not find a matching launch configuration for "${launches[name]}".`);
          return;
        }
        launchSelectedConfig(qpItem, arg, debugSessions);
      });
    }
    context.subscriptions.push(disposable);
    disposables.push(disposable);
  }
}


/**
 * Resolve a plain 'launches' setting value (e.g. "Config Name (folder)") to its
 * QPItemWithData, by matching it against the live set of all known configurations.
 * Resolved at invocation time (not registration time) so it reflects the current
 * workspace state, e.g. a workspace folder added after activation.
 *
 * Note: this plain format has no source tag (unlike the decorated names used
 * internally, e.g. "Config Name        (folder)        [launch.json]"), so it
 * can't be parsed with utilities.parseConfigurationName directly.
 *
 * @param {string} plainName - e.g. "Launch File (workspaceFolderName)"
 * @returns {Promise<QPItemWithData|undefined>}
 */
async function resolveLaunchesEntry(plainName) {

  const qpItemArray = configs.makeQPItemArray(await configs.getLaunchConfigNameMap());

  // try the whole string as a literal, unqualified config name first - covers
  // configs whose own name legitimately contains parentheses (e.g. a compound
  // with no folder context at all, per the README's "you do not need to have
  // a folder name" example), and is also where same-name-across-folders
  // collisions get resolved
  const exactMatches = qpItemArray.filter(item => item.label === plainName);
  if (exactMatches.length) return preferActiveFolder(exactMatches);

  // otherwise treat a trailing "(folderName)" as the documented disambiguator -
  // the user has explicitly picked a folder, so there's no ambiguity left
  const plainNameMatch = plainName.match(/^(?<configName>.+?)\s*\((?<folderName>[^)]+)\)$/);
  if (!plainNameMatch?.groups) return undefined;

  const { configName, folderName } = plainNameMatch.groups;
  return qpItemArray.find(item =>
    item.label === configName && (item.description || '').includes(`(${folderName})`));
}


/**
 * When a config name is ambiguous across multiple folders (and the user
 * hasn't disambiguated it with a "(folderName)" suffix), prefer whichever
 * candidate lives in the active editor's workspace folder. Otherwise fall
 * back to the first candidate, which is already in source/folder precedence
 * order (see configs.getLaunchConfigNameMap).
 *
 * @param {QPItemWithData[]} matches - all items sharing the same label
 * @returns {QPItemWithData}
 */
function preferActiveFolder(matches) {

  if (matches.length === 1) return matches[0];

  const activeFolder = utilities.getActiveWorkspaceFolder();
  if (!activeFolder) return matches[0];

  const activeMatch = matches.find(item => {
    const { folder } = utilities.parseConfigurationName(item.label + (item.description || ''));
    return folder === activeFolder.name;
  });

  return activeMatch || matches[0];
}


/**
 * Start debug sessions for the array of the named launch configurations
 *
 * @param {Array<QPItemWithData>} qpItems - an array of config names to run simultaneously
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
async function launchArrayOfConfigs(qpItems, arg, debugSessions) {
  // qpItems.forEach(async qpItem => await launchSelectedConfig(qpItem, arg, debugSessions));

  for await (const qpItem of qpItems) {
    // could add a delay here
    await launchSelectedConfig(qpItem, arg, debugSessions);
  }
}


/**
 * Start a debug session of the named launch configuration
 *
 * @param {QPItemWithData} qpItem - the 'name' key of one launch configuration/compound
 * @param {string} arg - the keybinding arg: "stop" or "stop/start" or "restart"
 * @param {Set<vscode.DebugSession>} debugSessions - Set of debugSessions
 */
async function launchSelectedConfig(qpItem, arg, debugSessions) {

  let handleStart;

  /** @type { string[] }*/
  let isCompoundConfig = [];  // TODO: does this only work for launch.json compounds

  let compoundSessionsMatch;
  let runningSession;

  if (debugSessions.size) {
    if (!Array.isArray(arg) && arg) handleStart = arg;           // if arg is an array it was from a task arg
    else handleStart = handleDebugSession.getStopStartSetting(); // will change if task args are introduced

    // isCompoundConfig = isCompound(name);
    isCompoundConfig = isCompound(qpItem.label + (qpItem.description ?? ''));
    if (isCompoundConfig.length)
      compoundSessionsMatch = handleDebugSession.isMatchingCompoundDebugSessions(debugSessions, isCompoundConfig);
    else
      runningSession = handleDebugSession.isMatchingDebugSession(debugSessions, qpItem.label + (qpItem.description ?? ''));
  }

  // @ts-ignore
  // a compound config and there is an already running matching session
  if (compoundSessionsMatch?.length) {

    if (handleStart === "start") {
      await startLaunch(qpItem);
    }
    // no other way to handle restarts of a compound configuration unfortunately
    else if (handleStart === "stop/start" || handleStart === "restart") {
      compoundSessionsMatch.forEach(runningSession => {
        handleDebugSession.stop(runningSession);
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await startLaunch(qpItem);
    }
    // else  (handleStart === "stop") {
    else {     // so "stop" is effectively the default
      compoundSessionsMatch.forEach(runningSession => {
        handleDebugSession.stop(runningSession);
      });
    }
  }
  // not a compound config but there is a already running matching session
  else if (runningSession?.match && runningSession.session) {
    // if (handleStart === "start") startLaunch(name);
    if (handleStart === "start") startLaunch(qpItem);
    else if (handleStart === "restart") handleDebugSession.restart(runningSession.session);
    else if (handleStart === "stop/start") handleDebugSession.stopStart(runningSession.session, qpItem);
    else handleDebugSession.stop(runningSession.session);  // handleStart === "stop", so the default
  }

  else await startLaunch(qpItem);
};


/**
 * startDebugging the launch name
 * @param {QPItemWithData} qpItem
 */
async function startLaunch(qpItem) {

  // name = "Launch Build.js (Project A Folder)"
  // name = "Launch Build.js (Project A Folder) [Settings]"
  // name = "Launch Build.js"

  let config;
  let rootMap = await configs.getAllConfigurations();

  if (qpItem.description) config = utilities.parseConfigurationName(qpItem.label + qpItem.description);

  // let settingsName = {
  //   "type": "node",
  //   "request": "launch",
  //   "name": "Launch Program - from TB/.vscode/settings.json - Launch2",
  //   "program": "C:\\Users\\markm\\OneDrive\\Test Bed\\testLaunch2.js"
  // };

  // let compound = {
  //   "name": "global setting compounds",
  //   "configurations": [
  //     "Launch Program - from settings - testLaunch",
  //     "Launch Program - from settings - mine"
  //   ]
  // };

  // vscode.commands.executeCommand('debug.startFromConfig', settingsName);  // this also works

  // both of these work for running a .vscode/settings.json config even if a launch.json exists
  // await vscode.debug.startDebugging(undefined, settingsName);
  // if (vscode.workspace.workspaceFolders) await vscode.debug.startDebugging(vscode.workspace.workspaceFolders[0], settingsName);

  // check if folderName is empty, if so use the  workSpaceFolder of the active editor
  let workspace = config?.folder
    ? vscode.workspace.workspaceFolders?.find(ws => ws.name === config.folder)
    : utilities.getActiveWorkspaceFolder();

  // if launch configs are in the user settings, must get the actual config to pass as an arg
  // see [https://github.com/microsoft/vscode/issues/109083]
  // vscode.debug.startDebugging should support named automatic (dynamic) 
  //      and global(user settings) debug configurations

  // Start debugging by using either a named launch or named compound configuration,
  //   or by directly passing a DebugConfiguration.The named configurations are looked up
  //     in '.vscode/launch.json' found in the given folder.
  // But it can't use a compound configuration from a settings file - it can't find the named configs therein
  // -from https://code.visualstudio.com/api/references/vscode-api#debug

  if (config?.setting === 'User Settings') {
    // to determine if it is a compound, has userConfig.configurations
    const userConfig = utilities.getUserSettingConfiguration(config.name);

    if (userConfig?.configurations)  // workspace amy be undefined
      await runCompoundConfigurations(userConfig, workspace, 'user settings', null);
    else if (userConfig) await vscode.debug.startDebugging(undefined, userConfig);
  }

  // compounds are NOT supported in code-workspaces
  else if (config?.setting === 'code-workspace') {
    if (workspace) {    // isn't there always a workspace here, opened directly with a code-workspace file

      let codeWorkspaceConfig = utilities.getCodeWorkspaceConfiguration(workspace, config.name);

      // a compound configuration will have codeWorkspaceConfig.configurations
      if (codeWorkspaceConfig?.configurations) {
        await runCompoundConfigurations(codeWorkspaceConfig, workspace, 'code-workspace', null);

        // does just await vscode.debug.startDebugging(workspace, config.name); work?  No
        // await vscode.debug.startDebugging(undefined, config.name);  No

        // let firstConfig = true;

        // for await (const name of codeWorkspaceConfig?.configurations) {

        //   const thisConfig = utilities.getCodeWorkspaceConfiguration(workspace, name);

        //   // stopAll is not supported in configurations (only compounds)
        //   if (thisConfig) {  // add presentation to all configs
        //     if (codeWorkspaceConfig.presentation) thisConfig.presentation = codeWorkspaceConfig.presentation;
        //     if (firstConfig) {  // add preLaunchTask to first one only
        //       if (codeWorkspaceConfig.preLaunchTask) thisConfig.preLaunchTask = codeWorkspaceConfig.preLaunchTask;
        //       firstConfig = false;
        //     }

        //     // check if from User Settings, 
        //     const userConfig = utilities.getUserSettingConfiguration(config.name);

        //     if (userConfig) await vscode.debug.startDebugging(undefined, userConfig);
        //     else await vscode.debug.startDebugging(workspace, thisConfig);
        //   }
        //   // might be a configuration from launch.json (w/in a code-workspace compound )
        //   else {
        //     // check if from User Settings, 
        //     const userConfig = utilities.getUserSettingConfiguration(config.name);

        //     if (userConfig) await vscode.debug.startDebugging(undefined, userConfig);
        //     else await vscode.debug.startDebugging(workspace, config.name);
        //   }
        // }
      }
      else if (codeWorkspaceConfig) await vscode.debug.startDebugging(workspace, codeWorkspaceConfig);
    }
  }
  // will handle compounds in settings.json! IFF no launch.json
  // else if (config.setting === '.vscode/settings.json') {  // workspace settings
  else if (config?.setting === 'Folder Settings') {  // workspace settings

    // scan every workspace folder's .vscode/settings.json for the named
    // config/compound. `workspace` (resolved above from config.folder) is
    // checked first - it's the specific folder this item was resolved from,
    // so a same-named config in another folder must not shadow it - then the
    // rest are scanned as a fallback for when `workspace` doesn't have it
    // (e.g. getActiveWorkspaceFolder's folders[0] fallback).
    const wsRootNodes = await getWorkspaceSettingsRootNodes();

    if (wsRootNodes.size && vscode.workspace?.workspaceFolders) {  // wsRootNodes = Map()

      const orderedFolders = workspace
        ? [workspace, ...vscode.workspace.workspaceFolders.filter(ws => ws.name !== workspace.name)]
        : vscode.workspace.workspaceFolders;

      for await (const ws of orderedFolders) {

        const root = wsRootNodes.get(ws.name);

        const theConfig = root?.configurations?.find(el => el.name === config.name);
        const theCompound = root?.compounds?.find(el => el.name === config.name);

        if (theConfig) await vscode.debug.startDebugging(ws, theConfig);
        else if (theCompound) {
          runCompoundConfigurations(theCompound, ws, 'workspace settings', wsRootNodes);
        }
        if (theConfig || theCompound) break;
      }
    }
  }

  else if (config?.setting === 'launch.json') {
    // this doesn't support a launch.json compound that contains a Folder Setting config, for example
    // or a compound from user settings, or config from code-workspace

    // can one launch.json reference a config from another launch.json ?
    // TODO: if so, may have to loop through all launchJSONRoots

    /** @type {Configuration[]} */
    let unsupportedConfigs = [];  // configs to remove and run sparately

    // if qpItem.configuration is a compound configuration
    if ('configurations' in qpItem.configuration) {
      ({qpItem, unsupportedConfigs} = await removeGlobals(rootMap, qpItem, workspace));
    }

    try {
      if ('configurations' in qpItem.configuration) {
        // compound: launch whatever's left locally via native compound support
        // (startDebugging by name works fine for a launch.json compound as long as
        // every remaining member is local to that same launch.json)
        if (qpItem.configuration.configurations?.length) {
          await vscode.debug.startDebugging(workspace, qpItem.label);
        }
        // then run each split-out (global-sourced) member separately - startDebugging
        // can't resolve those by name since they don't live in this launch.json
        for (const unsupported of unsupportedConfigs) {
          await runCompoundConfigurations(unsupported, workspace, '', null);
        }
      }
      else {
        await vscode.debug.startDebugging(workspace, qpItem.label);
      }
    }
    catch (/** @type { any } */ {name, message}) {
      console.log(message);
      // "Could not find launch configuration 'Launch Program - from TB/.vscode/settings.json - Launch2' in the workspace."
    }
  }

  else if (config?.name) {
    const userConfig = utilities.getUserSettingConfiguration(config.name);
    if (userConfig) await vscode.debug.startDebugging(undefined, userConfig);

    else await vscode.debug.startDebugging(workspace, config.name);
  }

  // if no config.name try undefined for User Settings and config.fullName
  else if (config?.fullName && qpItem.configuration) {
    const userConfig = utilities.getUserSettingConfiguration(config.fullName);
    if (userConfig) await vscode.debug.startDebugging(undefined, userConfig);
  }
}

/**
 * 
 * @param {Compound} compoundConfig - compoundConfig.configurations[]
 * @param {vscode.WorkspaceFolder|undefined} workspace
 * @param {string} scope - settingsOrCodeWorkspace
 * @param {Map<string, RootNode>|null} wsRootNodes
 */
async function runCompoundConfigurations(compoundConfig, workspace, scope, wsRootNodes) {

  let isCodeWorkspaceConfig = false;
  let isUserSettingsConfig = false;
  let isWorkspaceSettingsConfig = false;
  let firstConfig = true;

  if (!compoundConfig?.configurations?.length) return;

  for await (const config of compoundConfig.configurations) {

    let thisConfig;

    let codeWorkspaceConfig;
    let userSettingsConfig;
    let workspaceSettingsConfig;

    // the first config in a compound[] could be from a different scope

    // if (scope === 'code-workspace' && workspace) {
    //   thisConfig = utilities.getCodeWorkspaceConfiguration(workspace, config);
    //   if (thisConfig) isCodeWorkspaceConfig = true;
    // }
    // else if (scope === 'user settings') {
    //   thisConfig = utilities.getUserSettingConfiguration(config);
    //   if (thisConfig) isUserSettingsConfig = true;
    // }
    // else if (scope === 'workspace settings' && wsRootNodes) {
    //   // use parameter wsRootNodes to find thisConfig
    //   thisConfig = await utilities.getWorkspaceSettingConfiguration(wsRootNodes, config);
    //   if (thisConfig) isWorkspaceSettingsConfig = true;
    // }

    if (workspace) {
      codeWorkspaceConfig = utilities.getCodeWorkspaceConfiguration(workspace, config);
      if (codeWorkspaceConfig) isCodeWorkspaceConfig = true;
    }
    if (wsRootNodes) {
      // use parameter wsRootNodes to find thisConfig
      workspaceSettingsConfig = await utilities.getWorkspaceSettingConfiguration(wsRootNodes, config);
      // TODO: if undefined try userSetting or code-workspace - add this
      if (workspaceSettingsConfig) isWorkspaceSettingsConfig = true;
    }
    userSettingsConfig = utilities.getUserSettingConfiguration(config);
    if (userSettingsConfig) isUserSettingsConfig = true;

    // TODO: add launch.json ?
    thisConfig = codeWorkspaceConfig || workspaceSettingsConfig || userSettingsConfig;


    // stopAll is not supported in configurations (only compounds)
    if (thisConfig) {  // add presentation to all configs
      if (compoundConfig.presentation) thisConfig.presentation = compoundConfig.presentation;
      if (firstConfig) {  // add preLaunchTask to first one only
        if (compoundConfig.preLaunchTask) thisConfig.preLaunchTask = compoundConfig.preLaunchTask;
        firstConfig = false;
      }

      // if a configuration from these in whatever scope
      if (isUserSettingsConfig) await vscode.debug.startDebugging(undefined, thisConfig);
      else if (isCodeWorkspaceConfig) await vscode.debug.startDebugging(workspace, thisConfig);
      else if (isWorkspaceSettingsConfig) await vscode.debug.startDebugging(workspace, thisConfig);
    }

    // if a configuration from launch.json (w/in a code-workspace compound, etc.)
    else {
      if (isUserSettingsConfig) await vscode.debug.startDebugging(undefined, config);
      else if (isWorkspaceSettingsConfig) await vscode.debug.startDebugging(workspace, config);
      // TODO: add workspace settings here
      else await vscode.debug.startDebugging(workspace, config);
    }
  }
}


/**
 * The name configuration a compound configuration
 * @param {string} name
 * @returns {string[]}
 */
function isCompound(name) {

  // name: "Start 2 node debuggers (Test Bed)"
  // compoundArray[0].configurations : [ "First Debugger", "Second Debugger" ]

  // "compounds": [
  //   {
  //     "name": "Start 2 node debuggers",
  //     "configurations": ["First Debugger", "Second Debugger"],
  //     "stopAll": true,
  //     "preLaunchTask": "${defaultBuildTask}",
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
        if (config.name === parsedName.name && (
          !parsedName.folder || name === parsedName.fullName))      // overkill?
          match = config;
      });
    })
  }

  // "Start2DebuggersWS": ["First Debugger (Test Bed)", "Second Debugger (Test Bed)"],

  if (match) {
    // @ts-ignore
    return match.configurations.map(name => `${name}   (${parsedName.folder})   [launch.json]`);
  }
  else return [];
}

/**
 * 
 * @param {Map<string, Map<string, RootNode>>} rootMap 
 * @param {QPItemWithData} qpItem
 * @param {vscode.WorkspaceFolder|undefined} workspaceFolder
 * @returns 
 */
async function removeGlobals(rootMap, qpItem, workspaceFolder) {

  /** @type {Configuration[]} */
  let unsupportedConfigs = [];  // configs to remove and run sparately

  if ('configurations' in qpItem.configuration === false) return {qpItem, unsupportedConfigs};

  let globals, globalCompounds;

  /** @type {number[]} */
  let unsupportedIndices = [];  // indices in launch.json compound.configurations

  if (rootMap.has('globals')) globals = rootMap.get('globals');
  if (workspaceFolder && globals && globals?.has(workspaceFolder?.name)) globalCompounds = globals?.get(workspaceFolder?.name)?.compounds;

  if (globalCompounds) {

    qpItem.configuration.configurations?.forEach((compoundConfig, index) => {

      const match = globalCompounds?.filter((/** @type {Compound} */ globalCompound) => {
        return globalCompound.name === compoundConfig;
      });

      if (match?.length) {
        unsupportedIndices.push(index);
        // unsupportedConfigs.push(match);
        unsupportedConfigs.push(match[0]);
      }
    });
  }

  // for unsupportedIndices.reverse().length, apply splices
  for (const el of unsupportedIndices.reverse()) {
    qpItem?.configuration?.configurations?.splice(el, 1);
  }

  return {qpItem, unsupportedConfigs};
}

exports.launchSelectedConfig = launchSelectedConfig;
exports.launchArrayOfConfigs = launchArrayOfConfigs;
exports.startLaunch = startLaunch;