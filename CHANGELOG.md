# CHANGELOG

* 0.0.1 &emsp;  Initial release of `launch-config` extension
.
* 0.0.2 &emsp;  Added readme file and images.

* 0.0.3 &emsp;  Switched to `vscode.debug.startDebugging()` - much simpler.

* 0.0.4  &emsp; **BREAKING CHANGE** Added ability to bind any number of launch configs.

* 0.1.0 &emsp;  Added preliminary support for multiple workspaceFolders.

* 0.2.0 &emsp;  Added Intellisense in keybindings.json commands.

* 0.3.0 &emsp;  Added Intellisense in settings.json for launch configuration/compound 'name'.

* 0.4.0 &emsp;  More on using multi-root workspaces with multiple `launch.json` files.  
&emsp;&emsp; &emsp; Added the ability to run an array of launch configs from a single command.  
&emsp;&emsp; &emsp; Intellisense for array commands like `"RunAsArray": ["Launch Build.js (BuildSACC)", "Launch Build.js2 (TestMultiRoot)"]`.

* 0.5.0 &emsp;  Added command to show a QuickPick panel of all available launch configs, and select therefrom.

* 0.6.0 &emsp; Fixed so intellisense is only within the 'launches' setting, not triggered in other unrelated settings.  

* 0.7.0 &emsp; Added `launch-config.ifDebugSessionRunning` setting to stop, restart or stop/start a running debug session.  
&emsp;&emsp; &emsp; Added support for an argument in keybindings for individual debug session control.  
&emsp;&emsp; &emsp; Added more support for settings with no workspaceFolder name.  
&emsp;&emsp; &emsp; Fixed using keybinding args for compound configurations.  
&emsp;&emsp; &emsp; 0.7.1 &emsp; Added intellisense support in keybindings `args`.  

* 0.8.0 &emsp; Stop opening debug view (a fix for debug toolbar focus issues in vscode < v1.54, [issue](https://github.com/microsoft/vscode/issues/114914)).  
&emsp;&emsp; &emsp; Fixed completions for keybindings commands and args.  
&emsp;&emsp; &emsp; 0.8.2 &emsp; Added commands for navigating to the next/previous debug sessions in the call stack.  
