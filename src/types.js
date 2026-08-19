// eslint-disable-next-line no-unused-vars
const vscode = require('vscode');

/**
 * @typedef  {Object} Compound
 * @property {string} [name]
 * @property {string[]} [configurations]
 * @property {boolean} [stopAll]
 * @property {string} [preLaunchTask]
 * @property {object} [presentation]
 */

/**
 * @typedef  {Object} Configuration
 * @property {string} name
 * @property {string} request
 * @property {string} type
 */

/**
 * @typedef  {Object} RootNode
 * @property {string} [version] * 
 * @property {Compound[]} [compounds]
 * @property {Configuration[]} [configurations]
 */

/**
 * @typedef {  vscode.QuickPickItem & {configuration: Configuration|Compound}} QPItemWithData
 */