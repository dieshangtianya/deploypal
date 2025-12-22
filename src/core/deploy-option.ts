import path from 'path';
import versionGenerator from './version-generator';
import configHelper from './config';
import { AuthType } from './enum';
import * as fileHelper from './file-helper';

const DEFAULT_RELEASE_DIR = 'releases';

const getDefaultProjectName = async () => {
  const projectConfig = await configHelper.getProjectConfig();
  if (projectConfig && projectConfig.name) {
    return projectConfig.name;
  }
  return '';
};

const createDeployOptions = async function (deployConfig: DeployPalConfig, options: Partial<DeployOptions>): Promise<DeployOptions> {
  const { sshKeyPath, ...restDeploypalConfig } = deployConfig;

  const deployOptions: DeployOptions = {
    ...restDeploypalConfig,
    ...options,
  } as DeployOptions;

  // set the project name
  const defaultProjectName = await getDefaultProjectName();
  deployOptions.name = defaultProjectName;

  // set the release version
  if (!deployOptions.releaseVersion) {
    deployOptions.releaseVersion = versionGenerator.generateVersion();
  }

  // set the remote project directory
  const { name, remoteDir, useSymlink, currentSymlink } = deployOptions;
  if (remoteDir && name) {
    deployOptions.remoteReleaseDir = path.join(remoteDir, name, DEFAULT_RELEASE_DIR);
  }

  // set the current symlink path
  if (remoteDir && name && useSymlink && currentSymlink) {
    deployOptions.currentSymlinkDir = path.join(remoteDir, name, currentSymlink);
  }

  // set the ssh private key
  if (!deployOptions.sshPrivateKey && sshKeyPath) {
    const sshKeyPathReal = fileHelper.resolveSSHKeyPath(sshKeyPath);
    const isExist = await fileHelper.isFileExist(sshKeyPathReal);
    if (isExist) {
      const fileContent = await fileHelper.readFile(sshKeyPathReal);
      if (fileContent) {
        deployOptions.sshPrivateKey = fileContent;
      }
    } else {
      console.log('ssh key path is invalid');
    }
  }

  return deployOptions;
};

const createValidateResult = (message?: string) => {
  return {
    result: !!message,
    message,
  };
};

const validateDeployOptions = function (options: DeployOptions) {
  let message = '';
  if (!options.name) {
    message = 'Please provide option [name]';
    return createValidateResult(message);
  }
  if (!options.host) {
    message = 'Please provide option [host]';
    return createValidateResult(message);
  }
  if (!options.port) {
    message = 'Please provide option [port]';
    return createValidateResult(message);
  }
  if (!options.userName) {
    message = 'Please provide option [user-name]';
    return createValidateResult(message);
  }
  if (!options.authType) {
    message = 'Please provide option [auth-type]';
    return createValidateResult(message);
  }

  if (options.authType === AuthType.Password) {
    if (!options.password) {
      message = 'Please provide option [password]';
      return createValidateResult(message);
    }
  }

  if (options.authType === AuthType.PrivateKey) {
    if (!options.sshPrivateKey) {
      message = 'Please provide option [ssh-private-key]';
      return createValidateResult(message);
    }
  }

  if (options.useSymlink && !options.currentSymlink) {
    message = 'Please provide option [current-symlink]';
    return createValidateResult(message);
  }

  if (!options.remoteDir) {
    message = 'Please provide option [remote-dir]';
    return createValidateResult(message);
  }

  if (!options.localDir) {
    message = 'Please provide option [local-dir]';
    return createValidateResult(message);
  }

  return createValidateResult();
};

export default { createDeployOptions, validateDeployOptions };
