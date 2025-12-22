import inquirer from 'inquirer';
import { Command } from 'commander';
import ora from 'ora';
import { configHelper, AuthType } from '../../core';

import { createProgramLogger } from '../../logger';

const DEFAULT_PORT = 22;
const DEFAULT_USERNAME = 'root';
const DEFAULT_SSH_KEY_PATH = '~/.ssh/id_rsa';
const DEFAULT_LOCAL_DIR = './dist';
const DEFAULT_SERVER_DIR = '/var/www/html';
const DEFAULT_CURRENT = 'current';

const getDefaultConfig = () => {
  const defaultConfig: DeployPalConfig = {
    host: '',
    port: DEFAULT_PORT,
    userName: DEFAULT_USERNAME,
    authType: AuthType.Password,
    sshKeyPath: DEFAULT_SSH_KEY_PATH,
    password: '',
    useSymlink: true,
    currentSymlink: DEFAULT_CURRENT,
    localDir: DEFAULT_LOCAL_DIR,
    remoteDir: DEFAULT_SERVER_DIR,
  };
  return defaultConfig;
};

// initialize deploypal config command implementation
const initiConfig = async (program: Command, params: any) => {
  const programOptions: ProgramOptions = program.opts();
  const logger = createProgramLogger('deploypal-init', programOptions);
  if (programOptions.verbose) {
    logger.info('start to initialize deploypal config file');
    logger.info('init command params:', params);
  }
  let config = getDefaultConfig();
  if (!params.yes) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'host',
        message: 'Server IP:',
        validate: (input: string) => (input ? true : 'Server IP is required'),
      },
      {
        type: 'number',
        name: 'port',
        message: 'SSH port:',
        default: DEFAULT_PORT,
      },
      {
        type: 'input',
        name: 'username',
        message: 'SSH username:',
        default: DEFAULT_USERNAME,
      },
      {
        type: 'list',
        name: 'authType',
        message: 'Authentication method:',
        choices: [
          { name: 'Private Key', value: AuthType.PrivateKey },
          { name: 'Password', value: AuthType.Password },
        ],
      },
      {
        type: 'input',
        name: 'keyPath',
        message: 'SSH private key path:',
        default: DEFAULT_SSH_KEY_PATH,
        when: (answers) => answers.authType === AuthType.PrivateKey,
      },
      {
        type: 'password',
        name: 'password',
        message: 'SSH password:',
        mask: '*',
        when: (answers) => answers.authType === 'password',
      },
      {
        type: 'confirm',
        name: 'useSymlink',
        message: 'Use symlink',
        default: true,
      },
      {
        type: 'input',
        name: 'currentSymlink',
        message: 'Current symlink path',
        default: DEFAULT_CURRENT,
        when: (answers) => answers.useSymlink === true,
      },
      {
        type: 'input',
        name: 'localDir',
        message: 'Local build directory:',
        default: DEFAULT_LOCAL_DIR,
      },
      {
        type: 'input',
        name: 'remoteDir',
        message: 'Remote directory:',
        default: DEFAULT_SERVER_DIR,
      },
    ]);
    config = {
      ...getDefaultConfig(),
      ...answers,
    };
  }
  if (config.authType === AuthType.PrivateKey) {
    delete config.password;
  } else {
    delete config.sshKeyPath;
  }
  const spinner = ora('Creating deploypal config file...').start();
  try {
    await configHelper.saveDeploypalConfig(config);
    spinner.succeed('DeployPal config file "deploypal.config.json" has been created successfully.');
  } catch (error) {
    spinner.fail('Failed to create DeployPal config file.');
    if (programOptions.debug) {
      logger.error(error);
    }
  }
};

export default initiConfig;
