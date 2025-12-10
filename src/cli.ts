import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';

// initialize the CLI program
const program = new Command();

const figletArtText = figlet.textSync('DeployPal', {
	horizontalLayout: 'fitted',
});
console.log(chalk.green(figletArtText));

// Define the deploy command
program
	.command('deploy')
	.description('deploy front end web app')
	.action(() => {
		console.log('start to deploy the project');
	});

program
	.command('build')
	.description('build the project')
	.action(() => {
		console.log('building the project');
	});

program.parse(process.argv);
