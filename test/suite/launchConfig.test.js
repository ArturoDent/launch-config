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
});
