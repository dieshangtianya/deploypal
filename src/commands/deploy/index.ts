import { Command } from 'commander';
import { createProgramLogger } from '../../logger';
import SFTPDeployer from './sftp';
import { configHelper, deployOption } from '../../core';

// Note:
// There are several ways to implement uploading files to server, like
// (1) SCP protocol
// (2) SFTP protocol
// (3) rsync over SSH
// (4) FTP/SFTP libraries
// But the SFTP protocol is chosen for better compatibility in different server OS environments.

// deploy project command implementation
const deployProject = async (program: Command, params: Partial<DeployCommandOptions>) => {
  const programOptions: ProgramOptions = program.opts();
  const logger = createProgramLogger('deploypal-deploy', programOptions);
  if (programOptions.verbose) {
    logger.info('start to deploy project via SFTP protocol');
  }
  const deployConfig = await configHelper.getDeploypalConfig();
  const deployOptions = await deployOption.createDeployOptions(deployConfig!, params);

  const validateResult = deployOption.validateDeployOptions(deployOptions);
  if (validateResult.message) {
    logger.error(validateResult.message);
    return;
  }
  const deployer = new SFTPDeployer(programOptions, deployOptions, logger);
  const result = await deployer.deploy();

  logger.done('Project deploy successfuly, below is the release information:');
  logger.success('\n', result);
};

// register the deploy command
const register = (program: Command) => {
  program
    .command('deploy')
    .description('deploy front end web app to server or cloud')
    .option('--host <host>', 'Remote server IP')
    .option('--port <number>', 'Remote server port')
    .option('--user-name <user-name>', 'User name')
    .option('--auth-type <auth-type>', 'Authentication type(Password/PrivateKey)')
    .option('--password <password>', 'Password to login server')
    .option('--ssh-key-path <ssh-key-path>', 'SSH key file path')
    .option('--ssh-private-key <ssh-private-key>', 'SSH key text')
    .option('--passphrase <pass-phrase>', 'Passphrase to protect the ssh key')
    .option('--release-version <release-version>', 'Release version for the app')
    .option('--use-symlink', 'Determin deploy strategy')
    .option('--current-symlink <current-symlink>', 'Current symlink file name for server')
    .option('--local-dir <local-dir>', 'Local directory to deploy')
    .option('--remote-dir <remote-dir>', 'Remote directory for uploaded to')
    .option('--environment <environment>', 'Deploy environment')
    .action(async (params) => {
      await deployProject(program, params);
      process.exit(0);
    });
};

export default { register };
