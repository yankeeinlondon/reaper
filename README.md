# Reaper

A repo to help with static analysis of Typescript projects.

## The API Surface

```ts
const api = reaper();
```

When you first initialize the API surface you'll have the following API surface:

- **ts-morph** API's
  - `Project` API
  - `TypeChecker` API
  - `LanguageService` API
- **Package Info**
  - the `pkg` property will expose your repo's `package.json`
- **Source Files**
  - the `sourceFiles` dictionary contains the following endpoints:
    - `ast` - all of the `SourceFile`'s for your project
    - `files` - a simple API which gives you the following options:
      - `toCSV()` - plain text output in CSV format
      - `toString()` - plain text output, each file is a new line
      - `toConsole()` - for terminal output, provides terminal links as well as colors
      - `toJSON()` - output each file's `name`, `fqn`, as JSON
    - `getFileDetails(filepath)` - inspects a particular file and provides info on:
      - imports
      - exports
      - lastUpdated
      - 
  - property will provide `SourceFile` representations for all the files in your project
- **Get API** 
  - `getRuntime()` - extends the API to include utilities for runtime symbols (functions, classes, variables, etc.)
  - `getTypes()` - extends the API to include utilities for utilities involving the type system
  - `getDiagnostics()` - extends the API to include diagnostics found in the repo

Since the API always maintains a strict type definition between calls the GET API, you'll be able to use the API without really needing "documentation" as the types will be your guide.

### Locating your `tsconfig.json` file

For the **ts-morph** library to provide it's valient services to us we must point to the appropriate `tconfig` file. In the examples so far we've given no guidance and that is usually ok, however, should it not be able to determine which config file to use you'll be returned a descriptive error and you can explicitly point to the config file like so:

```ts
const api = reaper("./app/foo/tsconfig.json");
```

In this case we used a _relative_ path and that is fine so long as the path originates from the root of the repo which ${CWD} currently is in.


## Example Usage

```ts
/** 
 * get a bare minimum API surface
 */
const api = reaper();
/**
 * request the items you'll need
 */
const info = api.getRuntime();
/**
 * An array of all functions defined in the repo
 */
const functions = info.runtime.functions();

/**
 * An array of the classes defined in the repo
 */
const classes = info.runtime.classes();

/**
 * Get info about a file, including:
 *    - `lastUpdated`
 *    - `imports`
 *    - `exports`
 * 
 * and more.
 */
const file = info.sourceFiles.getFile("src/index.ts");
const files = info.sourceFiles.files.map(i => i.toConsole());
```

In this example you see us digging into the runtime symbols as well as details on source files. This may be what you want in one instance, but if you wanted something else you can choose from any of the `getXXX()` methods which will extend the API surface to include useful information. 

The main idea here is that you should pay the analysis cost only for data that you'll actually want. Once calling the `getXXX()` function you will pay for the analysis just once and can use it as part of the API to call as many times as you like.

