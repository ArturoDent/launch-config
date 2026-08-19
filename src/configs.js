const vscode = require('vscode');
const jsonc = require('jsonc-parser');
const utilities = require('./utilities');

/** @import { Compound, Configuration, RootNode, QPItemWithData } from "./types" */



/**
 * Get all launch configurations from all sources.
 * This does not check for vscode "unsupported" configurations, like compounds in user settings.
 * @returns {Promise<Map<string, Map<string, RootNode>>>} configArray
 */
exports.getAllConfigurations = async function () {

  let workspaceFolders = vscode.workspace.workspaceFolders;
  let configs = new Map();  // TODO make WeakMap() ?

  configs.set("launchJSONs", await module.exports.getLaunchJSONRootNodes());
  configs.set("wsSettings", await module.exports.getWorkspaceSettingsRootNodes());
  configs.set("codeWorkspace", await getCodeWorkspaceRootNode());

  if (workspaceFolders) {   // globals
    const globals = vscode.workspace.getConfiguration('launch', workspaceFolders[0].uri);  // just do once
    if (globals) {
      const globalConfigs = globals.inspect('configurations')?.globalValue;
      const globalCompounds = globals.inspect('compounds')?.globalValue;

      const globalsMap = new Map([[workspaceFolders[0].name, {configurations: globalConfigs, compounds: globalCompounds}]]);
      configs.set("globals", globalsMap);
    }
  }

  if (!configs.size) vscode.window.showErrorMessage('Could not find any launch configurations.');
  return configs;
};


/**
 * Build an array of all config/compound launch names
 * 
 * @returns {Promise<Map<string, Configuration|Compound>>} nameArray
 */
exports.getLaunchConfigNameMap = async function () {

  /** @type { Map<string, Map<string, RootNode>> } */
  const configMap = await module.exports.getAllConfigurations();

  let nameMap = new Map();

  if (configMap.size > 0) {

    let workspaceFolders = vscode.workspace.workspaceFolders;

    for (const [rootKey, rootMap] of configMap) {  // [key, value] of Map

      switch (rootKey) {

        case "globals":
          rootMap.forEach(config => {  // (config=value, key)
            config.compounds?.forEach(compound => nameMap.set(`${compound.name}        [User Settings]`, compound));
            config.configurations?.forEach(config => nameMap.set(`${config.name}        [User Settings]`, config));
          });
          break;

        case "launchJSONs":
          if (!workspaceFolders) continue;
          for (const ws of workspaceFolders) {
            let configurations = rootMap.get(ws.name)?.configurations || [];
            let compounds = rootMap.get(ws.name)?.compounds || [];
            configurations.forEach(config => nameMap.set(`${config.name}        (${ws.name})        [launch.json]`, config));
            compounds.forEach(compound => nameMap.set(`${compound.name}        (${ws.name})        [launch.json]`, compound));
          }
          break;

        case "wsSettings":
          if (!workspaceFolders) continue;
          for (const ws of workspaceFolders) {
            const configurations = rootMap.get(ws.name)?.configurations || [];
            const compounds = rootMap.get(ws.name)?.compounds || [];
            configurations.forEach(config => nameMap.set(`${config.name}        (${ws.name})        [Folder Settings]`, config));
            compounds.forEach(compound => nameMap.set(`${compound.name}        (${ws.name})        [Folder Settings]`, compound));
          }
          break;

        case "codeWorkspace":

          rootMap.forEach(config => {
            config.compounds?.forEach(compound => nameMap.set(`${compound.name}        [code-workspace]`, compound));
            config.configurations?.forEach(config => nameMap.set(`${config.name}        [code-workspace]`, config));
          });
          break;

        default:
          break;
      }
    }
  }

  return nameMap;
};


/**
 * @returns {Promise<Map<string, RootNode>>}
 * Get the launch.json files, if any, from all workspaceFolders  {Promise<Map<string, jsonc.Node>>}
 * 
 */
exports.getLaunchJSONRootNodes = async function () {

  /** @type { Map<string, RootNode> }*/
  const launchJSONRootNodeArray = new Map();  // TODO make WeakMap() ?

  if (vscode.workspace.workspaceFolders) {
    for await (const ws of vscode.workspace.workspaceFolders) {

      const wsRootNode = await getLaunchJSONRootNode(ws);
      if (wsRootNode) launchJSONRootNodeArray.set(ws.name, wsRootNode);
    }
  }

  return launchJSONRootNodeArray;
};

/**
 * Get the launch.json file, if any, from .vscode folder and check for configurations/compounds
 * @param {vscode.WorkspaceFolder} ws 
 * @returns {Promise<RootNode|undefined>}
 */
async function getLaunchJSONRootNode(ws) {

  const launchJSONFileUri = vscode.Uri.joinPath(ws.uri, '.vscode', 'launch.json');
  let launchJSONFile;

  try {
    await vscode.workspace.fs.stat(launchJSONFileUri);
    launchJSONFile = (await vscode.workspace.fs.readFile(launchJSONFileUri)).toString();
    const rootNode = jsonc.parse(launchJSONFile);
    if (rootNode?.configurations || rootNode?.compounds) return rootNode;
  }
  catch {
    // vscode.window.showInformationMessage(`${launchJSONFileUri.toString(true)} file does *not* exist`);
    return undefined;
  }

  return undefined;
};

/**
 * Get the .vscode/settings.json files, if any, from all workspaceFolders
 * 
 * @returns {Promise<Map<string, RootNode>>}
 */
exports.getWorkspaceSettingsRootNodes = async function () {

  /** @type { Map<string, RootNode> }*/
  const workspaceSettingsRootNodeArray = new Map();   // TODO make WeakMap() ?

  if (vscode.workspace.workspaceFolders) {
    for await (const ws of vscode.workspace.workspaceFolders) {
      const wsRootNode = await getWorkspaceSettingsRootNode(ws);
      if (wsRootNode) workspaceSettingsRootNodeArray.set(ws.name, wsRootNode);
    }
  }

  return workspaceSettingsRootNodeArray;
};

/**
 * Get the settings.json file, if any, from .vscode folder and check for configurations/compounds
 * 
 * @param {vscode.WorkspaceFolder} ws 
 * @returns {Promise<RootNode|undefined>}
 */
async function getWorkspaceSettingsRootNode(ws) {

  const workspaceSettingsUri = vscode.Uri.joinPath(ws.uri, '.vscode', 'settings.json');
  // have to stat the existence of file first
  let workspaceSettings;

  try {
    await vscode.workspace.fs.stat(workspaceSettingsUri);
    workspaceSettings = (await vscode.workspace.fs.readFile(workspaceSettingsUri)).toString();
    const rootNode = jsonc.parse(workspaceSettings);
    if (rootNode?.launch?.configurations || rootNode?.launch?.compounds) return rootNode.launch;
  }
  catch {
    // vscode.window.showInformationMessage(`${workspaceSettingsUri.toString(true)} file does *not* exist`);
    return undefined;
  }

  return undefined;
};

/**
 * 
 * @returns {Promise<Map<string,  RootNode>>}
 */
async function getCodeWorkspaceRootNode() {

  /** @type { Map<string, RootNode> }*/
  const codeWorkspaceRootNodeArray = new Map();   // TODO make WeakMap() ?
  const wsName = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].name : "noWorkspaceFolder";

  const codeWorkspaceUri = vscode.workspace.workspaceFile;
  let codeWorkspaceFile;

  // if !codeWorkspaceUri, try .vscode/*.code-workspace?  For all workspaces?
  if (codeWorkspaceUri) {
    try {
      await vscode.workspace.fs.stat(codeWorkspaceUri);
      codeWorkspaceFile = (await vscode.workspace.fs.readFile(codeWorkspaceUri)).toString();
      const rootNode = jsonc.parse(codeWorkspaceFile);
      if (rootNode?.settings?.launch?.configurations || rootNode?.settings?.launch?.compounds)
        return codeWorkspaceRootNodeArray.set(wsName, rootNode.settings.launch);
    }
    catch {
      return codeWorkspaceRootNodeArray;
    }
  }

  return codeWorkspaceRootNodeArray;
};


/**
 * Build the QuickPickItem array from a launch config name map. Shared by
 * quickPick.js (display) and launch.js (resolving a 'launches' setting entry).
 *
 * @param {Map<string, Configuration|Compound>} nameMap - launch configuration.name + (workspaceFolder)
 * @returns {QPItemWithData[]}
 */
exports.makeQPItemArray = function (nameMap) {

  /** @type { QPItemWithData[] }*/
  let qpItemArray = [];

  nameMap.forEach((configuration, name) => {

    const match = utilities.parseConfigurationToREGroups(name);

    if (match && match?.groups) {
      const {configName, folderName, settings} = match?.groups;

      var item = /** @type { QPItemWithData } */ ({});
      item.label = configName;
      item.configuration = configuration;
      // see https://github.com/microsoft/vscode/issues/175826 (Support Custom Data in QuickPickItem)
      // it is supported but difficult to work around typescript errors

      if (!folderName && settings === 'User Settings') {
        item.description = settings ? `   [User Settings]` : ``;  // shown in same line as item
      }
      else if (settings === 'Folder Settings') {
        item.description = settings ? `      (${folderName})   [Folder Settings]` : `   (null)`;
      }
      else if (settings === 'code-workspace') {
        item.description = settings ? `      [code-workspace]` : `   (null)`;  // shown in same line as item
      }
      else if (folderName && settings === 'launch.json') {
        item.description = settings ? `   (${folderName})   [launch.json]` : `   (${folderName})`;  // shown in same line as item
      }
      else {
        console.log();
      }
      qpItemArray.push(item);
      // it would be nice to use folderName as a separator label but need to use it for launch() methods
    }
  });

  return qpItemArray.filter(item => (item !== undefined));
};