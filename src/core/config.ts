import path from 'path';
import fs from 'fs/promises';
import * as fileHelper from './file-helper';

const configFileName = 'deploypal.config.json';

let currentDeployConfig: DeployPalConfig | null = null;

const projectConfigFileName = 'package.json';

let projectConfig: any = null;

const getDeploypalConfig = async function () {
  if (!currentDeployConfig) {
    const configFilePath = path.resolve(process.cwd(), configFileName);
    const configExist = await fileHelper.isFileExist(configFilePath);
    if (configExist) {
      const data = await fileHelper.readFile(configFilePath);
      if (data) {
        currentDeployConfig = JSON.parse(data);
      } else {
        currentDeployConfig = {} as DeployPalConfig;
      }
    }
  }
  return currentDeployConfig;
};

const saveDeploypalConfig = async function (config: DeployPalConfig) {
  await fs.writeFile('deploypal.config.json', JSON.stringify(config, null, 2), 'utf-8');
  currentDeployConfig = config;
};

const getProjectConfig = async function () {
  if (!projectConfig) {
    const configFilePath = path.resolve(process.cwd(), projectConfigFileName);
    const configExist = await fileHelper.isFileExist(configFilePath);
    if (configExist) {
      const data = await fileHelper.readFile(configFilePath);
      if (data) {
        projectConfig = JSON.parse(data);
      } else {
        projectConfig = {};
      }
    }
  }
  return projectConfig;
};

export default {
  configFileName,
  getDeploypalConfig,
  saveDeploypalConfig,
  getProjectConfig,
};
