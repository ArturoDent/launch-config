const fs = require('fs');
const path = require('path');
const jsonc = require('jsonc-parser');

const { runTests } = require('@vscode/test-electron');

// the real Code - Insiders profile - the User-Settings-sourced tests need a
// real global launch.configurations/compounds to read from (this is the
// profile that already has "global setting compounds" etc., which Test
// Bed's own launch.json compound cross-references). Code - Insiders must
// not be open when this runs, or the two instances will contend for the
// profile.
const USER_DATA_DIR = 'C:\\Users\\markm\\AppData\\Roaming\\Code - Insiders';
const REAL_SETTINGS_PATH = path.join(USER_DATA_DIR, 'User', 'settings.json');

// WorkspaceConfiguration.update() can't write launch.configurations/compounds
// at all ("not a registered configuration") - read access via .inspect()/.get()
// works fine (that's how the rest of the extension operates), but there's no
// API for writing it. So this edits the real settings.json file directly,
// the same way jsonc-parser is used elsewhere in this project, before VS Code
// even starts, and restores the exact original file content once the test
// run finishes (pass or fail).

const TEST_BED_FIXTURE = 'C:\\Users\\markm\\Dev\\Test Bed\\lcTestFixture.js';

const TEST_CONFIGURATIONS = [
  { type: 'node', request: 'launch', name: 'LC Test: User Settings simple', program: TEST_BED_FIXTURE },
  { type: 'node', request: 'launch', name: 'LC Test: User Settings compound member A', program: TEST_BED_FIXTURE },
  { type: 'node', request: 'launch', name: 'LC Test: User Settings compound member B', program: TEST_BED_FIXTURE },
];

const TEST_COMPOUNDS = [
  {
    name: 'LC Test: User Settings compound',
    configurations: ['LC Test: User Settings compound member A', 'LC Test: User Settings compound member B'],
  },
  {
    name: 'LC Test: compound (no folder context)',
    configurations: ['LC Test: User Settings compound member A', 'LC Test: User Settings compound member B'],
  },
];

/**
 * Append this suite's fixtures onto the existing launch.configurations/compounds,
 * preserving the rest of the file's formatting/comments via jsonc-parser.
 * @param {string} originalText
 * @returns {string}
 */
function injectTestFixtures(originalText) {

  const root = jsonc.parse(originalText) || {};
  const existingConfigurations = root.launch?.configurations || [];
  const existingCompounds = root.launch?.compounds || [];

  let text = originalText;
  text = jsonc.applyEdits(text, jsonc.modify(
    text, ['launch', 'configurations'], [...existingConfigurations, ...TEST_CONFIGURATIONS], {}));
  text = jsonc.applyEdits(text, jsonc.modify(
    text, ['launch', 'compounds'], [...existingCompounds, ...TEST_COMPOUNDS], {}));

  return text;
}

async function main() {

  const extensionDevelopmentPath = path.resolve(__dirname, '../');
  const extensionTestsPath = path.resolve(__dirname, './suite/index');

  // the developer's personal "Test Bed" sandbox, a sibling of this repo -
  // matches .vscode/launch.json's "Run Extension" config, which opens the
  // same folder for manual testing
  const testBedWorkspace = path.resolve(__dirname, '../../Test Bed/.vscode/Test Bed.code-workspace');

  const originalSettingsText = fs.readFileSync(REAL_SETTINGS_PATH, 'utf8');

  try {
    fs.writeFileSync(REAL_SETTINGS_PATH, injectTestFixtures(originalSettingsText), 'utf8');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [testBedWorkspace, '--user-data-dir', USER_DATA_DIR],
    });
  } catch (err) {
    console.error('Failed to run tests', err);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(REAL_SETTINGS_PATH, originalSettingsText, 'utf8');
  }
}

main();
