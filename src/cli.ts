import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import pkg from '../package.json';
import { TerminationMgr } from './core';
import initConfigCommand from './commands/init';
import deployProjectCommand from './commands/deploy';

// initialize the CLI program
const program = new Command();

const figletArtText = figlet.textSync('DeployPal', {
  horizontalLayout: 'fitted',
});

// console log the figlet art text in green color
console.log(chalk.green(figletArtText));

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// Define CLI program informaation
program.name('deploypal').version(pkg.version).description('A CLI tool to deploy web app to server or cloud');

// Define CLI common options
program
  .option('-d, --debug', 'output extra debugging information')
  .option('-v, --verbose', 'output verbose debugging information')
  .option('-H, --help', 'display help for command');

// Define the init command
initConfigCommand.register(program);

// Define the deploy command
deployProjectCommand.register(program);

// setup termination manager to manage exit scenarios
TerminationMgr.setup();

export function run() {
  program.parse(process.argv);
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}
