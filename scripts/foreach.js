#!/usr/bin/env node
// Runs a shell command once per file matching a glob. Replaces the abandoned
// @goenning/foreach-cli (glob 6 / minimatch 3) with glob 14, which depends on
// the patched minimatch.
//
// Usage: foreach.js -g GLOB -x COMMAND [-i IGNORE]
// Placeholders (either #{name} or {{name}}): path, root, dir, base, ext, name.

const { spawnSync } = require('child_process');
const path = require('path');
const { globSync } = require('glob');

const PLACEHOLDER = /(?:#\{|\{\{)([^/}]+)(?:\}\}|\})/g;
const USAGE = 'usage: foreach.js -g GLOB -x COMMAND [-i IGNORE]\n';

const parseArgs = (argv) => {
  const read = (flag, alias) => {
    const i = argv.findIndex((arg) => arg === flag || arg === alias);
    return i === -1 ? undefined : argv.at(i + 1);
  };
  return {
    glob: read('-g', '--glob'),
    command: read('-x', '--execute'),
    ignore: read('-i', '--ignore'),
  };
};

const buildCommand = (template, file) => {
  const parsed = path.parse(file);
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
  const options = parseArgs(process.argv.slice(2));

  if (!options.glob || !options.command) {
    process.stderr.write(USAGE);
    process.exit(2);
  }

  const files = globSync(options.glob, options.ignore ? { ignore: options.ignore } : {}).sort();

  for (const file of files) {
    // The command template comes from package.json and is executed through a
    // shell on purpose: it uses redirection (>) and other shell syntax.
    const { status, error } = spawnSync(buildCommand(options.command, file), {
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
