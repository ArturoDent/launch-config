const vscode = require('vscode');
const assert = require('assert');

/**
 * Run a launches.* command and wait for the matching debug session to start.
 * For a compound command, pass the name of one of its members - VS Code fires
 * onDidStartDebugSession once per member, not once for the compound as a whole.
 *
 * @param {string} commandId - e.g. "launches.testSimpleLaunchJson"
 * @param {string} expectedConfigName
 * @param {string} [expectedFolderName]
 * @param {number} [timeoutMs]
 * @returns {Promise<vscode.DebugSession>}
 */
async function runAndAwaitSession(commandId, expectedConfigName, expectedFolderName, timeoutMs = 10000) {

  const sessionPromise = new Promise((/** @type {(session: vscode.DebugSession) => void} */ resolve, reject) => {

    const timer = setTimeout(() => {
      disposable.dispose();
      reject(new Error(`Timed out waiting for debug session "${expectedConfigName}" to start after running ${commandId}`));
    }, timeoutMs);

    // some debug types suffix the session name (e.g. "name: detail") - match either form
    const disposable = vscode.debug.onDidStartDebugSession(session => {
      if (session.name === expectedConfigName || session.name.startsWith(`${expectedConfigName}:`)) {
        clearTimeout(timer);
        disposable.dispose();
        resolve(session);
      }
    });
  });

  await vscode.commands.executeCommand(commandId);
  const session = await sessionPromise;

  if (expectedFolderName) {
    assert.strictEqual(session.workspaceFolder?.name, expectedFolderName);
  }

  return session;
}

/**
 * Stop a session and wait for onDidTerminateDebugSession, so the next test
 * doesn't see a leftover "already running" session and take a different
 * branch in launchSelectedConfig.
 *
 * @param {vscode.DebugSession} session
 * @param {number} [timeoutMs]
 */
async function stopAndAwaitTermination(session, timeoutMs = 10000) {

  const terminatedPromise = new Promise((resolve, reject) => {

    const timer = setTimeout(() => {
      disposable.dispose();
      reject(new Error(`Timed out waiting for debug session "${session.name}" to terminate`));
    }, timeoutMs);

    const disposable = vscode.debug.onDidTerminateDebugSession(terminated => {
      if (terminated.id === session.id) {
        clearTimeout(timer);
        disposable.dispose();
        resolve(undefined);
      }
    });
  });

  await vscode.debug.stopDebugging(session);
  await terminatedPromise;
}

module.exports = { runAndAwaitSession, stopAndAwaitTermination };
