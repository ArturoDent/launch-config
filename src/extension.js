const vscode = require('vscode');
const launch = require('./launch');
const providers = require('./completionProviders');
const qp = require('./quickPick');


/** @type { Array<vscode.Disposable> } */
let disposables = [];

/** @type { Set<vscode.DebugSession> } */
let debugSessions = new Set();


/**
 * Fetch launch configuration user setting: 'launches'
 * Get matching launch.json configuration
 * - run/launch debug originally triggered with a keybinding
 *
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  
  // -----------------    set up functions   -------------------------------------------
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

  let disposable = vscode.commands.registerCommand('launches.showAllLaunchConfigs', async function () {
    await qp.setUpQuickPick(debugSessions);
  });
  
  context.subscriptions.push(disposable);
  disposables.push(disposable);

  // --------------------   event listeners   ---------------------------------

  context.subscriptions.push(vscode.debug.onDidStartDebugSession((session) => {
    let alreadyStored = false;
    // if configName and workspaceFolder already in Set, don't add
    debugSessions.forEach(storedSession => {
      if (storedSession.name === session.name.replace(/(.*):.*$/m, '$1') &&
          storedSession.workspaceFolder?.name === session.workspaceFolder?.name)

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