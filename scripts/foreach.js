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

const parseArgs = (argv) => {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-g' || arg === '--glob') {
      options.glob = argv[(i += 1)];
    } else if (arg === '-x' || arg === '--execute') {
      options.command = argv[(i += 1)];
    } else if (arg === '-i' || arg === '--ignore') {
      options.ignore = argv[(i += 1)];
    }
  }
  return options;
};

const buildCommand = (template, file) => {
  const parsed = path.parse(path.resolve(file));
  const values = {
    path: file,
    root: parsed.root,
    dir: parsed.dir,
    base: parsed.base,
    ext: parsed.ext,
    name: parsed.name,
  };
  return template.replace(PLACEHOLDER, (match, placeholder) =>
    Object.prototype.hasOwnProperty.call(values, placeholder) ? values[placeholder] : match
  );
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));

  if (!options.glob || !options.command) {
    process.stderr.write("usage: foreach.js -g '<glob>' -x '<command>'\n");
    process.exit(2);
  }

  const files = globSync(options.glob, options.ignore ? { ignore: options.ignore } : {}).sort();

  for (const file of files) {
    const command = buildCommand(options.command, file);
    const { status, error } = spawnSync(command, { shell: true, stdio: 'inherit' });
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
