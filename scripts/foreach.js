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

// Later flags overwrite earlier ones, matching the previous CLI's yargs parser.
// Unknown arguments throw so a typo cannot silently drop the ignore pattern and
// compile partials such as `_variables.less`.
const parseArgs = (argv) => {
  const options = new Map();
  const args = argv.slice();

  while (args.length > 0) {
    let flag = args.shift();
    let value;
    const eq = flag.indexOf('=');
    if (flag.startsWith('--') && eq !== -1) {
      value = flag.slice(eq + 1);
      flag = flag.slice(0, eq);
    }

    const key = FLAGS.get(flag);
    if (key === undefined) {
      throw new Error(`unknown argument: ${flag}`);
    }
    options.set(key, value === undefined ? args.shift() : value);
  }

  return options;
};

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

const main = () => {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
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

  const ignore = options.get('ignore');
  const files = globSync(glob, ignore ? { ignore } : {}).sort();

  for (const file of files) {
    // The command template comes from package.json and runs through a shell on
    // purpose: it uses redirection (>) and other shell syntax.
    const { status, error } = spawnSync(buildCommand(command, file), {
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
  }
};

main();
