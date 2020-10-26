# launch-config


## This vscode extension allows you to create a setting that identifies one of your `launch.json` configurations to run via a keybinding.
</br>

-----------------------------------------------------------------------------------------------


## Extension Settings


### This extension contributes two settings:</br></br>

`launch-config.runLaunchConfiguration`: Identify by `name` which launch.json configuration you would like to run.</br>

```json
"launch-config.runLaunchConfiguration": {
  "name": "Launch File"
}
```

</br>

&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;The `name` comes from one of your launch configurations in the `launch.json` file.  For example,

```json    
{
  "type": "node",
  "request": "launch",
  "name": "Launch File",    // use this in your setting
  "program": "${file}"
}
```


`launch-config.openDebug`: Open the Run/Debug View when running above command. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Default = `true`.

```json
"launch-config.openDebug": true,
```

-----------------------------------------------------------------------------------------------
</br>


## Keybindings</br>

&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; DEFAULT KEYBINDING:
</br>

![Default Keybinding](images/defaultKeyboardShortcut.jpg)

</br>

&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp; CUSTOM KEYBINDING:

![Custom Keybinding](images/customKeybinding.jpg)

-------------------------
</br>

## TODO

- [&nbsp;&nbsp;] - Add better error notifications: no setting, missing key, no match found.
- [&nbsp;&nbsp;] - Investigate support for more keybindings

-------------------------
</br>

## Known Issues
</br>

------------------------
</br>

## Release Notes

&emsp;&emsp;&emsp;0.0.1  Initial release of `launch-config` extension

&emsp;&emsp;&emsp;0.0.2  Added readme file and images


</br></br>
