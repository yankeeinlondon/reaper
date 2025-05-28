# Project Context

This project is intended to interogate a git repo which exists in the caller's filesystem. It will use the following tools to extract information:

1. Static Analysis via `ts-morph` package
2. Git Info via `simple-git` package
3. Locally defined functions using just node to fill in other details


## Reaper API

Although the repo is composed of many discrete functions, most of which leverage the `ts-morph` library, a user of this repo is encouraged to use this repo's exports via the `ReaperApi`.

You can think of the `ReaperApi` as a API surface which _composes_ all of the various functions defined in this repo into a human intuitive structure which encourages using only the minimum amount of "compute" required for the task the user has in mind.


## Testing

- All unit testing is done with the `Vitest` test runner
  - configuration file is at `./vitest.config.ts` but most settings are just autoconfiguration
- All test files should be put in the `./tests` directory and filenameing convention is to match the glob pattern of `tests/**/*.test.ts`
  - There should typically be a one-to-one relationship between a source file (or in some cases a source symbol defined in a source file) and a test file.
  - As we're building out the functionality there will be some test files missing but the goal is to have full coverage
  - When being asked to modify or add test files always run the test after making changes and ensure that your changes had the impact you were expecting.

## Devops

- The project is built using `tsdown` (a `rolldown` based bundler that mimics the CLI signatures and functionality of the popular `tsup` npm package).
- The package.json file contains both a `build` and `watch` command to produce the expected Javascript and _types_ which this repo exports
- This project will be published to **npm** as `@yankeeinlondon/reaper` and will use the `bumpp` npm package to manage the publishing steps
  - The package.json file, however, provides `release` as a script target which will run the `bumpp` process
- Linting is done with **eslint** using the newer flat configuration
  - We use a baseline eslint configuration defined by Anthony Fu's `@antfu/eslint-config` npm package but we do extend it in the `eslint.config.ts` file



## NPM Dependencies

- you can get a full list of all dependencies by looking at the `package.json` file, however, here is a quick summary of the key dependencies


### Key Packages

- **ts-morph**
  - [Documentation](https://ts-morph.com/)
  - [Repo](https://github.com/dsherret/ts-morph)
  - provides a useful API surface on top of the `tsc` compiler's
  - all Typescript source code undergoing static analysis will use `ts-morph` as it's primary tool
  - the functions defined in the `src/ast/` directory almost all good examples of encapsulating functional subsections of what we're trying to achieve

- all **npm** packages under `@yankeeinlondon/*` are controlled by the same author as this repo so should there be a need to _extend_ or _change_ the functionality these packages provide this can be considered rather than making the changes directly here.

   - `@yankeeinlondon/is-monorepo`:  provides utilities for detecting and typing a monorepo's setup/configuration
   - `@yankeeinlondon/package-json`: detects, loads, and types information about a `package.json` file
   - `@yankeeinlondon/kind-error`: provides a simple way to create better Javascript errors

    **Note:** all repos above are all very small and focused repos

- **chalk**
  - Provides support for generating console based escape codes for colors and formatting

- **repo-root**
  - Detects the root directory of a repository
  - Similar in many ways to the **npm** package `find-root` 
    - aim is to be robust than `find-root`
    - it checks for a `stopFile` -- which by default is `.git/HEAD` -- for detection purposes but the `stopFile` can be configured
    - also provides support for stopping at the boundary of a monorepo's
  - Strongly typed and with documentation support built into the types 

- **simple-git**
  - [Repo](https://github.com/steveukx/git-js)
  - a popular and fast **npm** package used for interogating `git` metadata
  - example:

    ```ts
    import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
        const options: Partial<SimpleGitOptions> = {
       baseDir: process.cwd(),
       binary: 'git',
       maxConcurrentProcesses: 6,
       trimmed: false,
    };

    // when setting all options in a single object
    const git: SimpleGit = simpleGit(options);

    // or split out the baseDir, supported for backward compatibility
    const git: SimpleGit = simpleGit('/some/path', { binary: 'git' });
    ```

    - The first argument to `simpleGit()` can be either a string (representing the working directory for git commands to run in), SimpleGitOptions object or undefined, the second parameter is an optional SimpleGitOptions object.
    - All configuration properties are optional, the default values are shown in the example above.

