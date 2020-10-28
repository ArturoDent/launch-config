# launch-config


## This vscode extension allows you to create a setting that identifies one of your `launch.json` configurations or compounds to run via a keybinding.

-----------------------------------------------------------------------------------------------


## Extension Settings


### This extension contributes one setting:</br>

- `launch-config.runLaunchConfiguration`: Identify by `name` which launch.json configuration you would like to run.  You can use `compounds` configurations as well.</br>

```json
"launch-config.runLaunchConfiguration": {
  "name": "Launch File"
}
```
or

```json
"launch-config.runLaunchConfiguration": {
  "name": "Start 2 node debuggers"
}
```


&emsp;&emsp;&emsp;The `name` comes from one of your launch compounds/configurations in the `launch.json` file.  The `name` key and value can be anywhere within its configuration - it does not need to be first.  An example `launch.json` file,

```json
{
  "version": "0.2.0",
  "compounds": [
    {
      "name": "Start 2 node debuggers",
      "configurations": ["First Debugger", "Second Debugger"],
      "preLaunchTask": "Start server",
      "stopAll": true
    }
  ],
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch File",
      "program": "${file}"
    },
    {
      "name": "First Debugger",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/test.js",
      "console": "integratedTerminal",
      "preLaunchTask": "renameTerminal"
    },
    {
      "name": "Second Debugger",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/gulpfile.js",
      "console": "integratedTerminal",
    }
  ]
}
```
</br>


-----------------------------------------------------------------------------------------------



## Command and Keybindings</br>

This extension contributes one command:  `launch-config.launchConfig` which can be found in the command palette or triggered by a keybinding.  It has a default keybinding: <kbd>Alt</kbd>+<kbd>F</kbd> (<kbd>Option</kbd>+<kbd>F</kbd> on the Mac).

&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; DEFAULT KEYBINDING:
</br>

![Default Keybinding](images/defaultKeyboardShortcut.jpg) 

</br>

&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; CUSTOM KEYBINDING:

Or choose whatever different keybinding you wish, shown here as <kbd>Alt</kbd>+<kbd>L</kbd>.  The second entry removes the default <kbd>Alt</kbd>+<kbd>F</kbd> version. 

```json
{
  "key": "alt+l",
  "command": "launch-config.launchConfig"
},

{
  "key": "alt+f",
  "command": "-launch-config.launchConfig"
}
  ```

-------------------------

## Known Issues

------------------------

## TODO

- [&nbsp; &nbsp;] - Add better error notifications: no setting, missing key, no match found - may not be possible using `debug.startDebugging()`.
- [&nbsp; &nbsp;] - Investigate support for more keybindings
- [&nbsp; &nbsp;] - Provide intellisense for `launch-config.runLaunchConfiguration` setting key: `name`

-------------------------

## Release Notes

&emsp;&emsp;&emsp;0.0.1   Initial release of `launch-config` extension

&emsp;&emsp;&emsp;0.0.2   Added readme file and images

&emsp;&emsp;&emsp;0.0.3   Switched to `vscode.debug.startDebugging()` - much simpler
&emsp;&emsp;&emsp;0.0.31  Remove unnecessary `return`'s.


</br>