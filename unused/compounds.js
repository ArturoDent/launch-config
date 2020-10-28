const vscode = require('vscode');
const configs = require('./configs');

// ***********************  Compounds  *******************************************


/**
 * @desc - get launch.json 'compounds' array, if one
 * @returns - compounds array if launch.json has 'compound' configs, else false
 */
exports.checkForCompoundConfigurations = function() {
  const compounds = vscode.workspace.getConfiguration('launch').get('compounds');
  if (compounds.length) return compounds;
  else return false;
};


  // "compounds": [
  //   {
  //     "name": "Compound 1",
  //     "configurations": ["Launch File", "Launch Chrome against localhost" ],
          // "presentation": {  // add to all configs 
          //   "hidden": false,
          //   "group": "",
          //   "order": 1
          // },
          // "stopAll": false,  // execute 'workbench.action.debug.stop' as many times as configurations started
          // "preLaunchTask": ""  execute 'workbench.action.tasks.runTask' first?  or better add it as a 'prelaunchTask' to all configs?
    // },

/**
 * @desc - get launch.json 'compounds' array, if one
 * @returns - compounds array if launch.json has 'compound' configs, else false
 */
exports.checkForCompoundStopAll = function() {
  const compounds = vscode.workspace.getConfiguration('launch').get('compounds');
  if (compounds.length) return compounds;
  else return false;
};


/**
 * @desc - get the 'compound' array element that matches user setting
 * 
 * @param {array} compounds 
 * @param {string} chosenConfigName 
 * @returns  - an array element 
 */
exports.findSelectedLaunchFromCompounds = function(compounds, chosenConfigName) {
  return compounds.find( element => element.name === chosenConfigName );
};


/**
 * @desc - check that all of the configs in the compound actually exist in the launch.json file
 * 
 * @param {array} chosenConfigs - user's object with 'name's
 * @param {array} launchConfigs - array of launch.json configurations
 * @returns {boolean}
 */
exports.checkAllCompoundConfigsExist = function(chosenConfigs, launchConfigs) {
  return chosenConfigs.every(name => configs.findSelectedLaunchFromConfigs(launchConfigs, name));
}


/**
 * @desc - build an array from launch.json configurations of all the user's chosen configuration
 * 
 * @param {array} chosenConfigs - user's object with 'name's
 * @param {array} launchConfigs - array of launch.json configurations
 * @returns {array}
 */
exports.getCompoundConfigurations = function(chosenConfigs, launchConfigs) {
  return chosenConfigs.map(name => configs.findSelectedLaunchFromConfigs(launchConfigs, name));
}