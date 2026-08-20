const vscode = require('vscode');
const assert = require('assert');
const path = require('path');
const { runAndAwaitSession, stopAndAwaitTermination } = require('./helpers');

// reused from TestMultiRoot.code-workspace as the multi-root scenario's second root
const EDITOR_MANAGER_PATH = 'C:\\Users\\markm\\OneDrive\\editor-manager';
const EDITOR_MANAGER_NAME = 'editor-manager';

suite('launch-config: launches.* end-to-end', function () {

  this.timeout(30000);

  suiteSetup(async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('ArturoDent.launch-config');
    assert.ok(ext, 'launch-config extension not found');
    await ext.activate();

    // the multi-root scenarios need a second root present up front, so the
    // "testSimpleMultiRoot"/"testCompoundMultiRoot" launches entries resolve
    const alreadyAdded = vscode.workspace.workspaceFolders?.some(ws => ws.name === EDITOR_MANAGER_NAME);
    if (!alreadyAdded) {
      const folderAdded = new Promise(resolve => {
        const disposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
          disposable.dispose();
          resolve(undefined);
        });
      });
      vscode.workspace.updateWorkspaceFolders(
        vscode.workspace.workspaceFolders?.length ?? 0, 0,
        { uri: vscode.Uri.file(EDITOR_MANAGER_PATH) }
      );
      await folderAdded;
    }
  });

  suite('simple configurations', function () {

    test('launch.json', async function () {
      const session = await runAndAwaitSession('launches.testSimpleLaunchJson', 'LC Test: launch.json simple');
      await stopAndAwaitTermination(session);
    });

    test('.code-workspace', async function () {
      const session = await runAndAwaitSession('launches.testSimpleCodeWorkspace', 'LC Test: code-workspace simple');
      await stopAndAwaitTermination(session);
    });

    test('User Settings', async function () {
      const session = await runAndAwaitSession('launches.testSimpleUserSettings', 'LC Test: User Settings simple');
      await stopAndAwaitTermination(session);
    });

    test('multi-root (second root)', async function () {
      const session = await runAndAwaitSession(
        'launches.testSimpleMultiRoot',
        'LC Test: multiRoot simple',
        'editor-manager'
      );
      await stopAndAwaitTermination(session);
    });
  });

  suite('compound configurations', function () {

    // compounds fire onDidStartDebugSession once per member, not once for the
    // compound itself - wait on member A as confirmation the compound launched

    test('launch.json', async function () {
      const session = await runAndAwaitSession('launches.testCompoundLaunchJson', 'LC Test: launch.json compound member A');
      await stopAndAwaitTermination(session);
    });

    test('.code-workspace', async function () {
      const session = await runAndAwaitSession('launches.testCompoundCodeWorkspace', 'LC Test: code-workspace compound member A');
      await stopAndAwaitTermination(session);
    });

    test('User Settings', async function () {
      const session = await runAndAwaitSession('launches.testCompoundUserSettings', 'LC Test: User Settings compound member A');
      await stopAndAwaitTermination(session);
    });

    test('multi-root (second root)', async function () {
      const session = await runAndAwaitSession(
        'launches.testCompoundMultiRoot',
        'LC Test: multiRoot compound member A',
        'editor-manager'
      );
      await stopAndAwaitTermination(session);
    });
  });

  suite('unqualified name resolution', function () {

    // no "(folderName)" suffix in the launches value this time - these prove
    // resolveLaunchesEntry finds the config by scanning every source/folder,
    // not just wherever the extension happens to be "sitting"

    test('cross-root: config exists only in a non-primary root', async function () {
      const session = await runAndAwaitSession(
        'launches.testCrossRootSimple',
        'LC Test: multiRoot simple',
        'editor-manager'
      );
      await stopAndAwaitTermination(session);
    });

    test('cross-root: compound exists only in a non-primary root', async function () {
      const session = await runAndAwaitSession(
        'launches.testCrossRootCompound',
        'LC Test: multiRoot compound member A',
        'editor-manager'
      );
      await stopAndAwaitTermination(session);
    });

    test('a config name containing its own parentheses is not mistaken for a folder suffix', async function () {
      const session = await runAndAwaitSession(
        'launches.testParentheticalName',
        'LC Test: User Settings compound member A'
      );
      await stopAndAwaitTermination(session);
    });
  });

  suite('active-folder collision preference', function () {

    // same config name defined independently in both Test Bed and
    // editor-manager's own launch.json - with no "(folderName)" disambiguator
    // in the launches value, resolution should follow the active editor

    test('falls back to the first workspace folder when nothing is active', async function () {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');

      const session = await runAndAwaitSession(
        'launches.testCollision',
        'LC Test: collision simple',
        'Test Bed'
      );
      await stopAndAwaitTermination(session);
    });

    test('falls back to the first workspace folder when the active file is outside every root', async function () {
      const outsideFixture = vscode.Uri.file(
        path.resolve(__dirname, '..', 'fixtures', 'outsideWorkspaceRoots', 'lcTestFixture.js')
      );
      const document = await vscode.workspace.openTextDocument(outsideFixture);
      await vscode.window.showTextDocument(document);

      try {
        const session = await runAndAwaitSession(
          'launches.testCollision',
          'LC Test: collision simple',
          'Test Bed'
        );
        await stopAndAwaitTermination(session);
      } finally {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      }
    });

    test('resolves a config that exists only in a non-default root, even when the active file is outside every root', async function () {
      const outsideFixture = vscode.Uri.file(
        path.resolve(__dirname, '..', 'fixtures', 'outsideWorkspaceRoots', 'lcTestFixture.js')
      );
      const document = await vscode.workspace.openTextDocument(outsideFixture);
      await vscode.window.showTextDocument(document);

      try {
        const session = await runAndAwaitSession(
          'launches.testCrossRootSimple',
          'LC Test: multiRoot simple',
          'editor-manager'
        );
        await stopAndAwaitTermination(session);
      } finally {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      }
    });

    test('follows the active editor into editor-manager', async function () {
      const editorManagerFile = vscode.Uri.file(`${EDITOR_MANAGER_PATH}\\lcTestFixture.js`);
      const document = await vscode.workspace.openTextDocument(editorManagerFile);
      await vscode.window.showTextDocument(document);

      try {
        const session = await runAndAwaitSession(
          'launches.testCollision',
          'LC Test: collision simple',
          'editor-manager'
        );
        await stopAndAwaitTermination(session);
      } finally {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      }
    });
  });

  suite('Folder Settings (.vscode/settings.json) resolution', function () {

    // same config name defined independently in both Test Bed's and
    // editor-manager's own .vscode/settings.json "launch.configurations" -
    // both folders also have a launch.json, so this proves a settings.json
    // config isn't shadowed just because launch.json exists elsewhere in the
    // workspace, and that a same-named collision still resolves to the
    // correct folder rather than whichever folder happens to scan first

    test('falls back to the first workspace folder when nothing is active', async function () {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');

      const session = await runAndAwaitSession(
        'launches.testFolderSettingsCollision',
        'LC Test: Folder Settings collision',
        'Test Bed'
      );
      await stopAndAwaitTermination(session);
    });

    test('follows the active editor into editor-manager', async function () {
      const editorManagerFile = vscode.Uri.file(`${EDITOR_MANAGER_PATH}\\lcTestFixture.js`);
      const document = await vscode.workspace.openTextDocument(editorManagerFile);
      await vscode.window.showTextDocument(document);

      try {
        const session = await runAndAwaitSession(
          'launches.testFolderSettingsCollision',
          'LC Test: Folder Settings collision',
          'editor-manager'
        );
        await stopAndAwaitTermination(session);
      } finally {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      }
    });
  });

  suite('already-running detection (ifDebugSessionRunning)', function () {

    // regression coverage for a bug where launchSelectedConfig's "is this
    // config already running" check always resolved the parsed config name
    // to '' (and, for Flutter/Dart sessions, couldn't see past the device
    // name the adapter appends to session.name) - either way it never found
    // a match, so a second launch always started a duplicate session instead
    // of honoring launch-config.ifDebugSessionRunning

    test('stop (default): launching the same config again stops the running session instead of duplicating it', async function () {

      const config = vscode.workspace.getConfiguration();
      const original = config.get('launch-config.ifDebugSessionRunning');
      await config.update('launch-config.ifDebugSessionRunning', 'stop', vscode.ConfigurationTarget.Workspace);

      /** @type {vscode.DebugSession | undefined} */
      let session;

      try {
        session = await runAndAwaitSession('launches.testSimpleLaunchJson', 'LC Test: launch.json simple');
        const sessionId = session.id;

        const stoppedByExtension = new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            disposable.dispose();
            reject(new Error('Timed out waiting for the already-running session to be stopped - a second, duplicate session was likely started instead'));
          }, 10000);

          const disposable = vscode.debug.onDidTerminateDebugSession(terminated => {
            if (terminated.id === sessionId) {
              clearTimeout(timer);
              disposable.dispose();
              resolve(undefined);
            }
          });
        });

        // relaunching the identical config should detect `session` as already
        // running and stop it (the "stop" default) - not start a second,
        // concurrent session alongside it
        await vscode.commands.executeCommand('launches.testSimpleLaunchJson');
        await stoppedByExtension;
        session = undefined; // already terminated, nothing left to clean up
      } finally {
        if (session) await vscode.debug.stopDebugging(session); // leftover from a failed/timed-out run
        await config.update('launch-config.ifDebugSessionRunning', original, vscode.ConfigurationTarget.Workspace);
      }
    });
  });
});
