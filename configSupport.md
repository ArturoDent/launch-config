# Which configurations are supported and where

"Unsupported" means that vscode will put warning squigglies ("Value is not accepted.") under any attempt to use such a configuration and intellisense will not offer such configurations.

For example, if you create a compound configuration in your User Settings and then try to use that in a `launch.json` configuration, vscode will put a warning squiggly under that User Setting compound reference in your `launch.json` compound configurations.

"Workspace folder" settings, including `launch` settings are found in each workspace folder's `.vscode/settings.json` file.

Two different things are being described below for each source:

1. What vscode **natively** resolves when you reference another configuration by name from inside a compound's `"configurations"` array (this is the "squigglies" behavior the intro above describes).  

2. What **this extension** can actually start via its `launches.*` commands or the "Show all launch configurations" picker - which is broader than #1 in several places, because the extension reads some sources directly (bypassing vscode's own, sometimes-shadowed, config merge) and manually orchestrates compound members that vscode itself can't resolve.  

## launch.json

### Supported

1. Individual (non-compound) configurations from that same `launch.json` file, referenced by name within a compound's `"configurations"` array - resolved natively by vscode.  

2. Individual (non-compound) User Settings configurations, referenced by name within a compound - resolved natively by vscode (e.g. `"Launch Program - from settings - testLaunch"` in the `Compound from TB launchJSON` fixture).  

3. User Settings **compounds**, referenced by name within a compound - not resolved natively (see Unsupported below), but this extension detects the reference and splits it out to run separately (`removeGlobals` in `src/launch.js`), so a `launch.json` compound that references a User Settings compound by name still works when run through this extension (e.g. `"global setting compounds"` in the same fixture).  

4. This extension can launch a config or compound from any `launch.json` in the workspace regardless of the active editor's own folder, or of whether the active editor is even inside the workspace at all - it scans every folder.  

### Unsupported

1. `.code-workspace` configurations or compounds, referenced by name from inside a `launch.json` compound.  

2. Workspace folder (`Folder Settings` / `.vscode/settings.json`) configurations or compounds, referenced by name from inside a `launch.json` compound.  

3. A configuration or compound from a *different* `launch.json` file (a different workspace folder's own file) - a launch.json compound can only resolve members local to that same file (plus User Settings, per Supported #2/#3 above). Note: vscode has an unrelated, unusual bug where a *missing* local member can occasionally still resolve to an identically-named config in a different folder's `launch.json` - see this project's [README Known Issues](README.md#known-issues).  

## User Settings

### Supported

1. Individual configurations - these are the only User Settings launch entries vscode natively resolves.  

### Unsupported

1. Compounds - User Settings only supports individual configurations natively; a `"compounds"` array in User Settings is not resolved by vscode's own `startDebugging()` lookup by name. This extension still lets you run a User Settings compound directly via `launches.*` (see `utilities.getUserSettingConfiguration`/`runCompoundConfigurations` in `src/`), and lets other compounds (in `launch.json`, `.code-workspace`, or Folder Settings) reference one by name (see the `launch.json`/`code-workspace`/`Folder Settings` Supported sections).  

## Workspace Settings (Folder Settings)

These are found in each workspace folder's own `.vscode/settings.json` file, under a `"launch"` key, as if it were a `launch.json` scoped to just that one folder.

### Supported

1. Individual (non-compound) User Settings configurations, referenced by name within a Folder Settings compound - resolved natively (e.g. `"Launch Program - from settings - testLaunch"` in Test Bed's own `.vscode/settings.json` compound).  

2. This extension resolves a Folder Settings config or compound correctly regardless of which workspace folder is active, regardless of whether it exists in more than one folder (a same-name collision resolves to the correct folder, not just whichever folder sorts first), and regardless of whether a `launch.json` also exists anywhere else in the workspace - it reads `.vscode/settings.json` directly rather than relying on vscode's own (sometimes-shadowed) config merge (see the `'Folder Settings'` branch in `src/launch.js`).  

### Unsupported

1. **Its own sibling configurations** (from that same `.vscode/settings.json` file), referenced by name within a Folder Settings compound - **as soon as any `launch.json` exists anywhere in the workspace**, vscode's own compound resolution can no longer see them at all, natively. Confirmed by testing: see the commented-out `"Launch file - from TB/.vscode/settings.json"` entry in Test Bed's `.vscode/settings.json`, annotated `// can't use local configs - IFF there are launch.json configurations`. (This extension's own `launches.*` resolution is unaffected by this - see Supported #2 above; it only affects vscode's native by-name resolution *within* a hand-written compound.)  

2. A `launch.json` configuration, referenced by name (with or without a `"(folderName)"` suffix), from inside a Folder Settings compound.  

3. A `.code-workspace` configuration or compound, referenced by name, from inside a Folder Settings compound.  

## code-workspace settings

These are found in a `.code-workspace` file, under `"settings": {"launch": {...}}`. A `.code-workspace` file is used to open a saved (often multi-root) workspace.  

### Supported

1. Individual (non-compound) configurations from that same `.code-workspace` file, referenced by name within a compound - resolved natively.  

2. A `launch.json` configuration, referenced by name **with an explicit `"(folderName)"` suffix**, from inside a `.code-workspace` compound - confirmed working (see Test Bed's `.code-workspace` compound: `"Launch Program2 - TB/launch.json        (mine.text.js)"  // this works`).  

3. Both individual configurations and compounds defined in a `.code-workspace` file are runnable through this extension. Natively, `vscode.debug.startDebugging()` has no way to resolve a compound *by name* when that compound lives only in a `.code-workspace` file's settings (compound-by-name lookup only works against an actual `.vscode/launch.json`) - so this extension reads the `.code-workspace` file directly and manually starts each compound member in turn (see `getCodeWorkspaceConfiguration` in `src/utilities.js` and the `'code-workspace'` branch of `src/launch.js`). This corrects an earlier limitation that used to be documented in this project's README ("launch configurations in a `*.code-workspace` can not be used with this extension") - that no longer applies; both `.code-workspace` configs and compounds are covered by this extension's automated tests.  

### Unsupported

1. Compounds defined only in a `.code-workspace` file, resolved **natively by vscode** (i.e. a bare `vscode.debug.startDebugging(workspaceFolder, "compoundName")` call, without this extension's manual orchestration) - see Supported #3 for how this extension works around it.  

2. A Folder Settings (`.vscode/settings.json`) configuration or compound, referenced by name from inside a `.code-workspace` compound - not attempted in this project's own test fixtures, but given that a Folder Settings compound can't even see its own sibling configs once a `launch.json` exists (see above), this is assumed unsupported natively too.
