# launch-config


### This vscode extension allows you to create settings to launch any number of your `launch.json` configurations or compounds via separate keybindings.</br></br>

> **BREAKING CHANGE** v0.0.4 is a breaking change - to allow multiple keybindings the form of the setting had to change.

-----------------------------------------------------------------------------------------------


## Extension Settings


### This extension contributes one setting:</br>

- `launches` (an object of key:value pairs): Identify by using your `launch.json` `"name"` which configuration you would like to run.  You can use `"compounds"` configurations as well.</br>

The first part of each entry, like `"RunNodeCurrentFile"`, can be anything you want (without spaces) - you will use it in the keybinding.  The second part, like `"Launch File"`, is the name of the configuration you would like to run.  &emsp; In `settngs.json`:

```json
  "launches": {

    "RunNodeCurrentFile": "Launch File",
    "RunCompound1": "Launch file and start chrome"  
  },
```

&emsp;&emsp;&emsp;The `name` key and value can be anywhere within its configuration - it does not need to be first.  An example `launch.json` file:

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
</br>


-----------------------------------------------------------------------------------------------



## Commands and Keybindings</br>

This extension does not contribute any user-accessible commands.

### Keybindings:

Choose whatever different keybindings you wish.  In your `keybindings.json`, here are example keybindings:

```json
  {
    "key": "alt+f",
    "command": "launches.RunNodeCurrentFile"
  },
  {
    "key": "alt+g",
    "command": "launches.RunCompound1"
  }
  ```

-------------------------

## Known Issues

------------------------

## TODO

- [&nbsp; &nbsp;&nbsp;] - Add better error notifications: no setting, missing key, no match found - may not be possible using `debug.startDebugging()`.
- [ X ] - Investigate support for more keybindings
- [&nbsp; &nbsp;&nbsp;] - Provide intellisense for `launches` settings, get all `"names"` fron launch.json

-------------------------

## Thank you

For the addition of the ability to bind any number of launch configurations to keybindings, I relied heavily on the code from [Jeff Hykin and macro-commander](https://marketplace.visualstudio.com/items?itemName=jeff-hykin.macro-commander).

-------------------------

## Release Notes

* 0.0.1   Initial release of `launch-config` extension

* 0.0.2   Added readme file and images

* 0.0.3   Switched to `vscode.debug.startDebugging()` - much simpler

&emsp;&emsp;&emsp;&emsp;&emsp;0.0.31  Remove unnecessary `return`'s.

* 0.0.4   **BREAKING CHANGE** Added ability to bind any number of launch configs 
 


</br>