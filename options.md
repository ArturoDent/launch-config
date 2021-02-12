<br/>

The setting **launch-config.ifDebugSessionRunning** has four options:  

```jsonc
  "launch-config.ifDebugSessionRunning": "stop",         // the default
  "launch-config.ifDebugSessionRunning": "stop/start",   // use this instead of restart for browser launches or compounds
  "launch-config.ifDebugSessionRunning": "restart", 
  "launch-config.ifDebugSessionRunning": "start",
```

Lets say you had a keybinding set up to launch some debug configuration like so:

```jsonc
  {
    "key": "alt+i",
    "command": "launches.MainFile"
  }
  ```  

And you launched that configuration (you triggered that keybinding).  What happens if you trigger the same keybinding again while that debug session is still running?  

In VS Code v1.53, a change was introduced so that when you try to launch a debug session again that is already running, a second instance of that launch configuration will be started. See [Start the same debug configuration multiple times](https://code.visualstudio.com/updates/v1_53#_debugging):

> We have removed the restriction that only a single debug session can be started from a launch configuration. You can now start multiple concurrent sessions by pressing the green run button in the debug configuration dropdown menu any number of times.

> Each subsequent debug session will have a number appended at the end of the name so they can be easily distinguished.

This extension will check the value of the setting `launch-config.ifDebugSessionRunning` in your `settings.json` file.  Thus, that running debug session will either be stopped (with no message notification), stopped and started again, restarted, or another concurrent session of the same launch configuration will be started.

This setting will determine how any running debug session is handled when its keybinding is re-triggered (unless its keybinding has its own argument - see below).  Think of the setting as a global setting on how to handle all running debug sessions. 

If you have no keybinding `args` and no `launch-config.ifDebugSessionRunning` setting, the default `stop` will be applied.  If you prefer a different result then set `launch-config.ifDebugSessionRunning` to one of the other options.   

-----------------

But maybe you want some sessions stopped and others restarted, etc. - here is how you can do that:

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

  * The keybinding argument will override the `launch-config.ifDebugSessionRunning` setting.  The keybinding argument is more specific and the the setting is more general.  

  *  `stop` is the **default** for the `launch-config.ifDebugSessionRunning` setting - so if you do not have the setting in your `settings.json` file and no argument in the matching keybinding, that debug session will be stopped if you retrigger the same keybinding.

  * See the [Known Issues](README.md) for an issue using the `restart` option to restart a browser launch.  
  * See the [Known Issues](README.md) for an issue using the `restart` option to restart a compound configuration.

  <br/>