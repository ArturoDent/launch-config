<br/>

The setting **launches.ifDebugSessionRunning** has three options:  

```jsonc
  "launches.ifDebugSessionRunning": "stop",         // the default
  "launches.ifDebugSessionRunning": "stop/start",   // use this instead of restart for browser launches
  "launches.ifDebugSessionRunning": "restart", 
```

Lets say you had a keybinding set up to launch some debug configuration like so:

```jsonc
  {
    "key": "alt+i",
    "command": "launches.MainFile"
  }
  ```  

And you launched that configuration (you triggered that keybinding).  What happens if you trigger the same keybinding again while that debug session is still running?  

This extension will check the value of the setting `launches.ifDebugSessionRunning` in your `settings.json` file.  Thus, that running debug session will either be stopped (with no message notification), stopped and started again, or restarted.

This setting will determine how any running debug session is handled when its keybinding is re-triggered (unless its keybinding has its own argument - see below).  Think of the setting as a global setting on how to handle all running debug sessions.  But maybe you want some sessions stopped and others restarted - here is how you can do that:

```jsonc
  {
    "key": "alt+g",
    "command": "launches.File1",
    "arg": "stop"
  },

  {
    "key": "alt+i",
    "command": "launches.File2",
    "arg": "restart"
  }
  ``` 

  Now, when `launches.File1` is running and you <kbd>alt</kbd>+<kbd>g</kbd> again (or whatever your chosen keybinding was), that matching debug session will be stopped.  But, if `launches.File2` was running, re-triggering its keybinding would restart that launch configuration.

  * The keybinding argument will override the `launches.ifDebugSessionRunning` setting.  The keybinding argument is more specific and the the setting is more general.  

  *  `stop` is the **default** for the `launches.ifDebugSessionRunning` setting - so if you do not have the setting in your `settings.json` file and no argument in the matching keybinding, that debug session will be stopped if you retrigger the same keybinding.

  * See the [Known Issues](README.md) for an issue using the `restart` option to restart a browser launch.  

  <br/>