# Launch Configs  

This vscode extension allows you to create settings to launch any number of your `launch.json` configurations or compound configurations via separate keybindings.  These launch configs can be in any root folder in a multi-root workspace.  And a launch config from one root folder can be triggered while in a file from a different root folder.  And you can create arrays of launch configs to run with a single keybinding.  

<br>

[From [startDebugging()](https://code.visualstudio.com/api/references/vscode-api#debug)  documentation.] :  

> The named configurations are looked up in `.vscode/launch.json` found in the given folder. Before debugging starts, all unsaved files are saved and the launch configurations are brought up-to-date. Folder specific variables used in the configuration (e.g. `${workspaceFolder}`) are resolved against the given folder.  

<br>

The above caution has been modified by a later update to vscode (v1.54).  Now you can explicitly set vscode to **not** save any unsaved files prior to debugging:  

```jsonc
// Controls what editors to save before starting a debug session.  

// allEditorsInActiveGroup: Save all editors in the active group before starting a debug session.  
// nonUntitledEditorsInActiveGroup: Save all editors in the active group except untitled ones before starting a debug session.  
// none: Don't save any editors before starting a debug session.  

"debug.saveBeforeStart": "allEditorsInActiveGroup", 
```

<br>

If you use this extension to start a launch configuration from a workspace folder different than that of the **active editor**, note that vscode's built-in folder-specific variables, like  `${workspaceFolder}`, will be resolved to the folder that you are calling into, **but** variables like `${file}` in that same launch configuration will be resolved to the active text editor at the time of triggering the command - which may not even  be in that same workspaceFolder.  This may not be what you expect.

<br>

Prior to v0.7.0, if you had started a debug session with a keybinding, and then re-triggered the same keybinding, it would fail and you would get a warning notification from vscode about attempting to start an already running launch configuration.  With v0.7.0 this has been reworked so that you have more control over an already running debug session.  Now you can choose to stop it, stop and then start it, start or restart it either through a setting which controls the handling of all currently running debug sessions or through a keybinding argument for that specific debug session.

For more on this new functionality, see [session options](options.md).  

-----------------------------

## Features  

* Shortcuts for launch configurations, in `settings.json`
* Run any launch configuration found in any multi-root folder in a workspace, in `settings.json`  

```jsonc
  "launches": {
    "RunNodeCurrentFile": "Serve File (Project A Folder)",
    "RunNodeCurrentFileB": "Launch File (Project B Folder)"
  }
```

In keybindings.json or added from the Keyboard Shortcuts UI:  

```jsonc
  {
    "key": "alt+g",               <== whatever keybinding you wish    
    "command": "launches.RunNodeCurrentFile",
    "arg": "restart"              <== optional, see the session options
  }
```

Trigger from a Project A or Project B editor:  

```jsonc
  {
    "key": "alt+h",                       
    "command": "launches.RunNodeBuildFileA"
  },
  {
    "key": "alt+i",                       
    "command": "launches.RunNodeBuildFileB"
  }
```

* Run an array of launch configurations from any `launch.json` in the workspace, in `settings.json`:

```jsonc
  "launches": {
    "RunLaunchArray": ["Launch File (Project A)", "Launch File (Project B)"]
  }
```

```jsonc
  {
    "key": "alt+j",
    "command": "launches.RunLaunchArray"
  }
  ```

* Open a QuickPick panel of all available launch configurations.  Select and run one or many from this list.

----------  

## Extension Settings  

### This extension contributes two settings:  

<br>

1. `launches` (an object of key : value pairs): Identify by using your `launch.json name` which configuration you would like to run.  You can use `"compounds"` configurations as well.  

The first part of each entry, like `"RunNodeFile"`, can be anything you want (without spaces) - you will use it in the keybinding.  The second part, like `"Launch File"`, is the name of the configuration you would like to run. In `settings.json`:  

```jsonc
"launches": {

  "RunNodeFile": "Launch File (<some workspaceFolder name>)",  // the folder name will be provided for you
  "RunCompound1": "Launch file and start chrome"           // but you do not need to have a folder name
},
```

You will get intellisense in your `settings.json` for the 'name' of all possible launch configurations or compound configurations.  This intellisense will include all configurations and root folder names if you are in a multi-root workspace.  That folder name is used to resolve which `launch.json` to look in for the corresponding configuration (especially important where the same config `name` - like `Launch File` - is used in multiple `launch.json` files).  

<img src="https://github.com/ArturoDent/launch-config/blob/main/images/launchesSettingsIntellisense.gif?raw=true" width="900" height="250" alt="Intellisense for Launch Settings demo"/>  

<br>  

</br> The launch config `name`s can be anything - I just happened to use "Launch" at the beginning of all these demo names, that is not necessary.  

<br>

Although intellisense will automatically append the folder name, you do not need to use one.  If it is absent then the `activeEditorWorkSpace` will be used; so only the current workspaceFolder `launch.json` will be examined.  

The `name` key and value can be anywhere within its configuration - it does not need to be first. An example `launch.json` file:  

```json
{
  "version": "0.2.0",
  "compounds": [
    {
      "name": "Launch file and start chrome",
      "configurations": ["Launch File", "Launch Chrome against localhost"],
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
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:8080",
      "webRoot": "${workspaceRoot}",
      "file": "${workspaceRoot}/build.html"
    }
  ]
}
```

<br>

2.`launch-config.ifDebugSessionRunning` : Options: `"stop/start"`, `"stop"` (the default), `"restart"` or `start`  

This setting controls how to handle a currently running debug session when triggering the same keybinding again for that launch configuration.   See more at [session options](options.md).  

<br>

------------------

## Commands and Keybindings

### This extension contributes three commands:  

This extension generates commands from settings created by the user. These generated commands will appear in `Keyboard Shortcuts` and keybindings can be assigned there or manually, with intellisense, in `keybindings.json`.  In this example there are four settings from which commands have been generated and two of those have had keybindings associated with them previously.  

<img src="https://github.com/ArturoDent/launch-config/blob/launchInSettings/images/shortcuts.gif?raw=true" width="1000" height="250" alt="Keybindings shortcuts demo"/>  

1. This extension also provides one built-in command `launches.showAllLaunchConfigs` which opens a QuickPick panel of all available launch configurations.  From this panel you can select and run one or more configurations.  Note: there is no guarantee that the configs will be run in the order you select them as just an alphabetical list of selections is returned by vscode.  

2. You can "select" any checkbox in the QuickPick by <kbd>Space</kbd> when that configuration is highlighted.  <kbd>Space</kbd> acts as a toggle to check or uncheck the checkbox.  Hit <kbd>Enter</kbd> when you have selected all checkboxes you want to run.  

3. If you only want to run 1 configuration you can highlight that config (arrow up or down, no need to select the checkbox) and hit <kbd>Enter</kbd>.  

<img src="https://github.com/ArturoDent/launch-config/blob/launchInSettings/images/LaunchQuickPick.gif?raw=true" width="1000" height="400" alt="QuickPick demo"/>

<br><br>

1. `launches.focusNextDebugSession` : no default keybinding  

`Launch Configs: Focus the next debug session` (<= how it appears in the Command Palette) This command will focus the next debug session in the call stack.  So if you have at least two debug sessions running at the same time you can use this command to focus the next one after the previously focused session.  This is the same as clicking on a session in the call stack view or choosing one from the debug toolbar dropdown or the debug console dropdown.  

3. `launches.focusPreviousDebugSession` : no default keybinding  

`Launch Configs: Focus the previous debug session`  (<= how it appears in the Command Palette)This command will focus the previous debug session in the call stack.  

> The extension api does not provide a direct way to programmatically focus other debug sessions, so these commands are a little "kludgy" and use `list` navigation commands to do so.  This is not optimal but I believe the best that can be done at this point.  

You can create your own keybindings for these two commands either through the Keyboard Shortcuts GUI or adding these to your `keybindings.json`:

```jsonc
{
  "key": "alt+1",        // whatever keybinding you wish
  "command": "launches.focusNextDebugSession"
},
{
  "key": "alt+2",        // whatever keybinding you wish
  "command": "launches.focusPreviousDebugSession"
}
```

<br/>  

--------------------  

### Keybindings for running launch configurations:

Choose whatever different keybindings you wish.  Here are example keybindings (in `keybindings.json`):  

```jsonc
  {
    "key": "alt+f",
    "command": "launches.RunAsArray"
    // "when": "editorTextFocus && editorLangId == javascript"  // for example
  },
  {
    "key": "alt+g",
    "command": "launches.RunCompound",
    "args": "restart"     // see Note below on using args in a keybinding
  },
  {
    "key": "alt+k",
    "command": "launches.showAllLaunchConfigs"  // open the QuickPick with available configs
  },
  ```

You will get intellisense in your `keybindings.json` file for the `launches.showAllLaunchConfigs` command and upon typing the `"launches."` part of the command.  Then you will see a list of your available completions from your `settings.json`, such as `RunAsArray` and `RunCompound`.  

* Note: see **[session options](options.md)** for more on using args in a keybinding.

<img src="https://github.com/ArturoDent/launch-config/blob/main/images/keybindingsIntellisense.gif?raw=true" width="600" height="200" alt="Intellisense for Keybindings demo"/>

-------------------------  

## Known Issues  

1. The `restart` option does not work when re-launching a browser.  Example:  

```jsonc
  {
    "type": "chrome",
    "request": "launch",
    "name": "Launch Chrome against localhost",
    "url": "http://localhost:8081",
    "file": "${workspaceFolder}/build.html"
  }
```

The browser will not successfully restart the **second time** - **use the `stop/start` option instead** when launching browsers.

2. Similar to Issue 1, the `restart` option does not work when restarting a compound configuration from your `launch.json` file(s).  From the `launch.json` example above:  

```jsonc
  "compounds": [
    {
      "name": "Launch file and start chrome",
      "configurations": ["Launch File1", "Launch File2"],
      "preLaunchTask": "Start server",
      "stopAll": true
    }
  ],
```

When vscode starts this the first time, each debug session has a separate name and `id`, like `Launch File1`, but **no compound name or compopund id**, here the name would be `Launch file and start chrome`.  This is a problem because the `workbench.action.debug.restart` requires a session.id to know which debugging session to restart.  But there is no session.id that represents the compound configuration as a whole.  

So this extension will simply stop and start the compound configuration, but not "restart" it (in some situations there is a difference).  `stop/start` works as an option; the `restart` option will do the same thing as `stop/start`.  

3. In a multi-root workspace you can create launch configurations and compounds in a `*.code-workspace` file.  This extension is able to retrieve those but **cannot** scope a debugging session to that file.  Thus launch configurations in a `*.code-workspace` can not be used with this extension.  `vscode.debug.startDebugging(workspaceFolder|undefined, name|Configuration)` needs to be scoped to a workspaceFolder.  

4. There is an unusual bug in vscode that pertains only to multi-root workspaces where you have at least two `launch.json` files with identically-named configurations that are used in a compound configuration.  So if you have this in *projectA's* `launch.json`:  

```jsonc
"compounds": [
      {
          "name": "Launch file and start chrome",
                                            // what if no "Launch File" config in file?
          "configurations": ["Launch File", "Launch Chrome against localhost" ],
          "stopAll": true 
      },
    ],
```

but assume there is actually **no** `Launch File` config in that file (*projectA*).  If there should happen to be a `Launch File` config in *projectB's* `launch.json` that *projectB* `Launch File` will be started by vscode.  That should not happen when the `startDebugging()` command is scoped to *projectA* - that debug call should fail and not look for another identically-named config somewhere in the multi-root workspace.  

Of course, you shouldn't have a compound config that lists a configuration that doesn't exist in that same file - that is an error.  So this bug should be easily avoided.  

-----------------------

## TODO

Explore retrieval of launch configs from `.code-workspace` files in a multi-root workspace.  
Explore support for task arguments.  
Explore generating a command directly from keybindings.  

-------------------------

## Thank you  

For the addition of the ability to bind any number of launch configurations to keybindings, I relied heavily on the code from [Jeff Hykin and macro-commander](https://marketplace.visualstudio.com/items?itemName=jeff-hykin.macro-commander).

For determining the workspaceFolder of the current file, I used code from [rioj7's command-variable](https://github.com/rioj7/command-variable/tree/39ff184e2c32e01e8dd429a796568b2ef6617d32).

For helping getting Intellisense working in keybindings.json for `launches.` commands, see [rioj7's answer](https://stackoverflow.com/a/64593598/836330).  

-------------------------

## Release Notes  

For earlier release notes see the [CHANGELOG](CHANGELOG.md).

* 0.8.0 &emsp; Stop opening debug view (a fix for debug toolbar focus issues in vscode < v1.54, [issue](https://github.com/microsoft/vscode/issues/114914)).  
&emsp;&emsp; &emsp; Fixed completions for keybindings commands and args.  
&emsp;&emsp; &emsp; 0.8.2 &emsp; Added commands for navigating to the next/previous debug sessions in the call stack.  

* 0.9.0 &emsp; Modify QuickPick listener to allow keyboard trigger (without mouse).  

<br>  
