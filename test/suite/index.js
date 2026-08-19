const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');

/**
 * Recursively find every *.test.js file under dir.
 * @param {string} dir
 * @returns {string[]}
 */
function findTestFiles(dir) {

  /** @type {string[]} */
  let results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) results = results.concat(findTestFiles(entryPath));
    else if (entry.isFile() && entry.name.endsWith('.test.js')) results.push(entryPath);
  }

  return results;
}

function run() {

  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 20000,
  });

  const suiteRoot = path.resolve(__dirname);

  findTestFiles(suiteRoot).forEach(file => mocha.addFile(file));

  /** @type {Promise<void>} */
  const result = new Promise((resolve, reject) => {
    try {
      mocha.run(failures => {
        if (failures > 0) reject(new Error(`${failures} tests failed.`));
        else resolve();
      });
    } catch (err) {
      reject(err);
    }
  });

  return result;
}

module.exports = { run };
