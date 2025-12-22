import { Command } from 'commander/typings';
import initConfig from './init-config';

// register the init config command
const register = (program: Command) => {
  program
    .command('init')
    .description('initialize a deploypal config file')
    .option('-y, --yes', 'use default options and skip prompts')
    .action(async (params) => {
      await initConfig(program, params);
      process.exit(0);
    });
};

export default { register };
