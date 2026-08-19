# Which configurations are supported and where

"Unsupported" means that vscode will put warning squigglies ("Value is not accepted.") under any attempt to use such a configuration and intellisense will not offer such configurations.  

For example, if you create a compound configuration in your User Settings and then try to use that in a `launch.json` configuration, vscode will put the warning squiggly under that User Setting compound reference in your `launch.json` compound configurations.  

"Workspace folder" settings, including `launch` settings are found in each workspace folder's `.vscode/settings.json` file.  

## launch.json

### Supported

1. User settings individual configurations, not compounds
2. Configurations within that `launch.json` file (other launch.json files?)  

### Unsupported

1. User settings compounds
2. `.code-workspace` configurations or compounds
3. Workspace folder configurations or compunds  

## User Settings

### Unsupported

1. Compounds

## Workspace Settings

These are found in each workspace folder's `.vscode/settings.json` files.

### Supported

### Unsupported

## code-workspace settings

 These are found in a `.code-workspace` which is used to open a saved workspace and may contain multiple workspace folders.  

### Supported

### Unsupported
