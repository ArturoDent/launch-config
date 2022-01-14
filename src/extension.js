const vscode = require('vscode');
const launch = require('./launch');
const providers = require('./completionProviders');

/** @type { Array<vscode.Disposable> } */
let disposables = [];

/** @type { Set<vscode.DebugSession> } */
let debugSessions = new Set();



/**
 * @description - fetch launch configuration user setting: 'launches'
 * @description - get matching launch.json configuration
 * @description - run/launch debug originally triggered with a keybinding
 *
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  // -------------------    start-up functions    ---------------------------------------
  launch.loadLaunchSettings(context, disposables, debugSessions);
  providers.makeKeybindingsCompletionProvider(context);
  providers.makeSettingsCompletionProvider(context);
  
  // -----------------------  commands  -------------------------------------------------
  
  let disposableNext = vscode.commands.registerCommand('launches.focusNextDebugSession', async function () {
    
    await vscode.commands.executeCommand('workbench.debug.action.focusCallStackView');
    await vscode.commands.executeCommand('list.selectAll');
    await vscode.commands.executeCommand('list.collapseAll');
    await vscode.commands.executeCommand('list.focusPageDown');
    await vscode.commands.executeCommand('list.select');
  });
  context.subscriptions.push(disposableNext);
  disposables.push(disposableNext);
  
  let disposablePrevious = vscode.commands.registerCommand('launches.focusPreviousDebugSession', async function () {

    await vscode.commands.executeCommand('workbench.debug.action.focusCallStackView');
    await vscode.commands.executeCommand('list.selectAll');
    await vscode.commands.executeCommand('list.collapseAll');
    await vscode.commands.executeCommand('list.focusPageUp');
    await vscode.commands.executeCommand('list.select');
    // await vscode.commands.executeCommand('list.expand');
  });
  context.subscriptions.push(disposablePrevious);
  disposables.push(disposablePrevious);
  
  //  --------------  showAllLaunchConfigs  -----------
  let disposable2 = vscode.commands.registerCommand('launches.showAllLaunchConfigs', async function () {

    const workSpaceFolders = vscode.workspace.workspaceFolders;
    let nameArray = providers.getLaunchConfigNameArray(workSpaceFolders);

    // add spaces to the nameArray just for the QuickPick
    // unfortunately the QuickPick panel is not rendered in a monospaced font so this has to be just a guess

    const regex = /^(.+?)\s*(\(.*\))$|^(.*)$/m;

    // TODO - this might not be necessary anymore
    nameArray = nameArray.map(name => {

      // @ts-ignore
      // eslint-disable-next-line no-unused-vars
      let [fullString, configName, folderName] = name.match(regex);
      let padding = (80 - configName.length > 0) ? (80 - configName.length)/1.4 : 1;
      return configName.padEnd(padding, ' ') + folderName;
    });

    // nameArray must be a string[]
    return vscode.window.showQuickPick(nameArray, {
      canPickMany: true,
      placeHolder: "Select launch configuration(s) to run"
    }).then(items => {
      if (items) {
        if (Array.isArray(items)) {
          launch.launchArrayOfConfigs(items, '', debugSessions);  // if multiple selections: array
        }
        else launch.launchSelectedConfig(items, '', debugSessions);  // if only one config selected = string
      }
    });
  });
  context.subscriptions.push(disposable2);
  disposables.push(disposable2);

  // -------------------    event listeners    ------------------------------------------


  context.subscriptions.push(vscode.debug.onDidStartDebugSession((session) => {
    let alreadyStored = false;
    // if configName and workspaceFolder already in Set, don't add
    debugSessions.forEach(storedSession => {
      if (storedSession.name === session.name.replace(/(.*):.*$/m, '$1') &&
          storedSession?.workspaceFolder?.name === session.workspaceFolder?.name)

              alreadyStored = true;
    })

    if (!alreadyStored) debugSessions.add(session);
  }));

  context.subscriptions.push(vscode.debug.onDidTerminateDebugSession((session) => {
    debugSessions.delete(session);
  }));

  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {

		if (event.affectsConfiguration("launches")) {

			for (let disposable of disposables) {
				disposable.dispose();
			}
			// reload
			launch.loadLaunchSettings(context, disposables, debugSessions);
		}
  }));

  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
    for (let disposable of disposables) {
      disposable.dispose();
    }
    launch.loadLaunchSettings(context, disposables, debugSessions);
  }));
};

// function deactivate() {}

exports.activate = activate;