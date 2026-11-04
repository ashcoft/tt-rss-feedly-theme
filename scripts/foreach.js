#!/usr/bin/env node
// Runs a shell command once per file matching a glob. Replaces the abandoned
// @goenning/foreach-cli (glob 6 / minimatch 3) with glob 14, which depends on
// the patched minimatch.
//
// Usage: foreach.js -g '<glob>' -x '<command>' [-i '<ignore glob>']
// Placeholders (either #{name} or {{name}}): path, root, dir, base, ext, name.

const { spawnSync } = require('child_process');
const path = require('path');
const { globSync } = require('glob');

const PLACEHOLDER = /(?:#\{|\{\{)([^/}]+)(?:\}\}|\})/g;
const USAGE = "usage: foreach.js -g '<glob>' -x '<command>' [-i '<ignore glob>']\n";

const FLAGS = new Map([
  ['-g', 'glob'],
  ['--glob', 'glob'],
  ['-x', 'command'],
  ['--execute', 'command'],
  ['-i', 'ignore'],
  ['--ignore', 'ignore'],
]);

// Splits an optional inline value off a flag, e.g. `--glob=src/*.less`.
const splitFlag = (arg) => {
  const eq = arg.indexOf('=');
  return eq === -1 ? [arg, null] : [arg.slice(0, eq), arg.slice(eq + 1)];
};

// Parses `-g value` and `--glob=value` forms. Later flags overwrite earlier
// ones, matching the previous CLI's yargs parser. Unknown arguments throw so a
// typo cannot silently drop the ignore pattern and compile LESS partials.
const parseArgs = (argv) => {
  const options = new Map();
  const args = [...argv];

  while (args.length > 0) {
    const [flag, inlineValue] = splitFlag(args.shift());
    const key = FLAGS.get(flag);
    if (key === undefined) {
      throw new Error(`unknown argument: ${flag}`);
    }
    options.set(key, inlineValue === null ? args.shift() : inlineValue);
  }

  return options;
};

// Reads the required glob and command, writing usage and exiting when either is
// missing or an argument is unknown.
const readOptions = (argv) => {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`${error.message}\n${USAGE}`);
    process.exit(2);
  }

  const glob = options.get('glob');
  const command = options.get('command');
  if (!glob || !command) {
    process.stderr.write(USAGE);
    process.exit(2);
  }

  return { glob, command, ignore: options.get('ignore') };
};

// Substitutes the placeholders for one file. path.resolve keeps dir/root
// absolute, matching the previous CLI's output.
const buildCommand = (template, file) => {
  const parsed = path.parse(path.resolve(file));
  const values = new Map([
    ['path', file],
    ['root', parsed.root],
    ['dir', parsed.dir],
    ['base', parsed.base],
    ['ext', parsed.ext],
    ['name', parsed.name],
  ]);
  return template.replace(PLACEHOLDER, (match, placeholder) =>
    values.has(placeholder) ? values.get(placeholder) : match
  );
};

// Runs one command. The template comes from package.json and runs through a
// shell on purpose: it uses redirection (>) and other shell syntax.
const runCommand = (template, file) => {
  const { status, error } = spawnSync(buildCommand(template, file), {
    shell: true,
    stdio: 'inherit',
  });
  if (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
  if (status !== 0) {
    process.exit(status === null ? 1 : status);
  }
};

// Entry point: run the command once for every matching file.
const main = () => {
  const { glob, command, ignore } = readOptions(process.argv.slice(2));
  for (const file of globSync(glob, ignore ? { ignore } : {}).sort()) {
    runCommand(command, file);
  }
};

main();
