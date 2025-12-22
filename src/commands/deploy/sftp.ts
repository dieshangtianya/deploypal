import path from 'path';
import ora from 'ora';
import dayjs from 'dayjs';
import { SFTPClient, versionGenerator, fileHelper } from '../../core';
import { createUUID } from '../../helper';

class SFTPDeployer {
  logger: ILogger;
  programOptions: ProgramOptions;
  deployOptions: DeployOptions;
  sftpClient;
  constructor(programOption: ProgramOptions, deployOptions: DeployOptions, logger: ILogger) {
    this.programOptions = programOption;
    this.deployOptions = deployOptions;
    this.logger = logger;
    this.sftpClient = new SFTPClient();
  }

  async connect() {
    const options: any = {
      host: this.deployOptions.host,
      port: this.deployOptions.port,
      username: this.deployOptions.userName,
      readyTimeout: 30000,
    };
    if (this.deployOptions.password) {
      options.password = this.deployOptions.password;
    } else if (this.deployOptions.sshPrivateKey) {
      options.privateKey = this.deployOptions.sshPrivateKey;
    }

    if (this.deployOptions.passphrase) {
      options.passphrase = this.deployOptions.passphrase;
    }

    try {
      await this.sftpClient.connect(options);
    } catch (error: any) {
      if (this.programOptions.debug) {
        this.logger.error(error.message);
      }
      this.logger.error('Connection failed');
      throw new Error(`SSH connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.sftpClient) {
      try {
        await this.sftpClient.end();
      } catch (endErr) {
        console.warn('Error during disconnect:', endErr);
      }
    }
  }

  async createDirectoryStructure() {
    const dirs = [this.deployOptions.remoteReleaseDir];
    for (const dir of dirs) {
      const isExist = await this.sftpClient.exists(dir);
      if (!isExist) {
        this.logger.info(`Test the directory ${dir} not exist, start to create the directory`);
        await this.sftpClient.mkdir(dir, true);
        this.logger.done(`Create directory ${dir} successfully`);
      }
    }
  }

  getReleaseVersion(): string {
    const { releaseVersion } = this.deployOptions;
    return releaseVersion || versionGenerator.generateVersion();
  }

  async uploadToReleaseDir(releaseVersionDir: string) {
    const spinner = ora(`Uploading files to ${path.basename(releaseVersionDir)}...\n`).start();
    let releaseVersionDirCreated = false;
    try {
      // create release version directory
      const isReleaseDirExist = await this.sftpClient.exists(releaseVersionDir);
      if (isReleaseDirExist) {
        const files = await this.sftpClient.list(releaseVersionDir);
        if (files.length > 0) {
          throw new Error(`Please check the release version dir ${releaseVersionDir}, it is not empty directory`);
        }
      }

      await this.sftpClient.mkdir(releaseVersionDir, true);
      releaseVersionDirCreated = true;

      const files = await fileHelper.getFiles(this.deployOptions.localDir);
      let uploaded = 0;
      for (const file of files) {
        const relativePath = path.relative(this.deployOptions.localDir, file.path);
        const remotePath = path.posix.join(releaseVersionDir, relativePath.replace(/\\/g, '/'));
        // get the parent directory name
        const remoteParent = path.posix.dirname(remotePath);
        // make sure the parent directory exist
        await this.sftpClient.mkdir(remoteParent, true);
        // upload file
        await this.sftpClient.put(file.path, remotePath);
        uploaded++;

        // when uploaded file count is many times of 10, then change the spinner text
        if (uploaded % 10 === 0) {
          spinner.text = `Uploading... ${uploaded}/${files.length} files`;
        }
      }
      spinner.succeed(`Uploaded ${uploaded} files to ${path.basename(releaseVersionDir)}`);
    } catch (error: any) {
      spinner.fail(`Failed to upload files to ${path.basename(releaseVersionDir)}...\n`);
      try {
        if (releaseVersionDirCreated) {
          // remove the release version directory
          await this.sftpClient.rmdir(releaseVersionDir, true);
        }
      } catch (err: any) {
        // ignore the error here
        this.logger.warn(`Remove release version directory error: ${err.message}`);
      }
      throw error;
    }
  }

  async validateReleaseVersion(releaseVersionDir: string) {
    const spinner = ora('Validating version...').start();
    try {
      const requiredFiles = ['index.html'];
      for (const file of requiredFiles) {
        const remoteFile = path.posix.join(releaseVersionDir, file);
        const exists = await this.sftpClient.exists(remoteFile);

        if (!exists) {
          throw new Error(`Required file not found: ${file}`);
        }
      }
    } catch (error: any) {
      spinner.fail('Validate release version failed');
      throw error;
    }
  }

  async removeBackupLink(backupLink: string) {
    try {
      await this.sftpClient.unlink(backupLink, true);
      this.logger.verbose(`Cleaned the backup symlink`);
    } catch (error: any) {
      this.logger.warn(`Failed to clean up the backup symlink, error: ${error.message}`);
    }
  }

  async removeTempLink(tempLink: string) {
    const isTempLinkExist = await this.sftpClient.exists(tempLink);
    if (isTempLinkExist) {
      await this.sftpClient.unlink(tempLink);
      this.logger.verbose('Remove the temp current symlink');
    }
  }

  async recoverCurrentLink(currentLink: string, backupLink: string) {
    const isCurrentLinkExist = await this.sftpClient.exists(currentLink);
    if (isCurrentLinkExist) {
      await this.sftpClient.unlink(currentLink);
      this.logger.verbose('Remove the new created current symlink');
    }
    try {
      await this.sftpClient.rename(backupLink, currentLink);
      this.logger.info(`Recover the previous version`);
    } catch (error: any) {
      this.logger.warn(`Failed to recover to the previous version, error:${error.message}`);
    }
  }

  /**
   * switch release version dir
   * @param releaseVersionDir
   * scenarios as below
   *  |--/var/www/myapp/
   *  |--releases/
   *  |--current-->releases/v3
   *
   *  /var/www/html/ -->var/www/myapp/current (publicUrl, here current is symlink)
   *  as a matter of fact, the public url is the target directory of proxy server
   */
  async switchReleaseVersionWithSymlink(releaseVersionDir: string) {
    const currentLink = this.deployOptions.currentSymlinkDir;
    const uuid = createUUID();

    // declare temp symlink and backup symlink
    const tempLink = `${currentLink}.tmp.${uuid}`;
    const backupLink = `${currentLink}.backup.${uuid}`;

    let tempLinkCreated = false;
    let backupLinkCreated = false;

    try {
      // step 1: check whether deployOptions.currentSymlink is symlink
      const isCurrentLinkExist = await this.sftpClient.exists(currentLink);
      if (isCurrentLinkExist) {
        this.logger.info('currentSymlink exists');
        // here lstat will query symlink metadata, not target
        const stats = await this.sftpClient.lstat(currentLink);
        const currentIsLink = stats.isSymbolicLink;
        if (!currentIsLink) {
          throw new Error('currentSymlink is not a symlink file');
        }
      } else {
        this.logger.info('currentSymlink does not exit');
      }
      this.logger.verbose('Checked whether deployOptions.currentSymlink is symlink');

      // step 2: check whether releaseVersionDir is exist
      const isReleaseVersionDirExist = await this.sftpClient.exists(releaseVersionDir);
      if (!isReleaseVersionDirExist) {
        throw new Error(`Release version directory not found: ${releaseVersionDir}`);
      }
      this.logger.verbose('Checked whether releaseVersionDir is exist');

      // step 3: check releaseVersionDir is directory
      const releaseVersionStats = await this.sftpClient.stat(releaseVersionDir);
      if (!releaseVersionStats.isDirectory) {
        throw new Error(`releaseVersionDir ${releaseVersionDir} is not a directory`);
      }
      this.logger.verbose('Checked whether releaseVersionDir is exist');

      // step 4: check temp symlink and backup symlink
      const isTempLinkExist = await this.sftpClient.exists(tempLink);
      if (isTempLinkExist) {
        await this.sftpClient.unlink(tempLink);
      }
      const isBackuupLinkExist = await this.sftpClient.exists(backupLink);
      if (isBackuupLinkExist) {
        await this.sftpClient.unlink(backupLink);
      }
      this.logger.verbose('Check temp symlink and backup symlink');

      // step 5: create temp symlink
      await this.sftpClient.symlink(releaseVersionDir, tempLink);
      tempLinkCreated = true;
      this.logger.verbose('Create the temp current symlink successfully');

      // step 6: validate temp symlink
      const tempTarget = await this.sftpClient.readlink(tempLink);
      if (tempTarget !== releaseVersionDir) {
        throw new Error(`Temp symlink verification failed`);
      }
      this.logger.verbose('Check the temp current symlink target path');

      // step 7: backup current symlink
      if (isCurrentLinkExist) {
        await this.sftpClient.rename(currentLink, backupLink);
        backupLinkCreated = true;
        this.logger.verbose('Found the current symlink, backup the current symlink');
      } else {
        this.logger.verbose('There is no current symlink');
      }

      // step 8: rename the temp link to current
      // rename templink to currentLink, note that in unix the operation is atomic
      // if current is exist, will mark it deleted and create it
      try {
        await this.sftpClient.rename(tempLink, currentLink);
      } catch (basicError) {
        this.logger.error('Failed to switch to the new release version');
        throw basicError;
      }

      // step 9: remove the backuplink
      if (backupLinkCreated) {
        await this.removeTempLink(backupLink);
      }
    } catch (error) {
      this.logger.error(`There is an error while switching to the ${releaseVersionDir}, start to clean symlinks`);

      // remove the temp link
      if (tempLinkCreated) {
        await this.removeTempLink(tempLink);
      }

      // remove the backup link
      if (backupLinkCreated) {
        await this.removeBackupLink(backupLink);
      }

      // recover backup symlink
      if (backupLinkCreated) {
        await this.recoverCurrentLink(currentLink, backupLink);
      }

      throw error;
    }
  }

  // eslint-disable
  async switchReleaseVersionWithRename(releaseVersionDir: string) {
    this.logger.info(releaseVersionDir);
    throw new Error('Not support to switch release version with rename strategy');
  }

  async execReleaseVersionSwitch(releaseVersionDir: string) {
    this.logger.info('Performing release version switch...');
    try {
      if (this.deployOptions.useSymlink) {
        await this.switchReleaseVersionWithSymlink(releaseVersionDir);
      } else {
        await this.switchReleaseVersionWithRename(releaseVersionDir);
      }
      this.logger.done('Perform release version switch successfully');
    } catch (error: any) {
      this.logger.error('Perform release version switch failed');
      throw error;
    }
  }

  async deleteReleaseVersionDir(releaseVersionDir: string | null) {
    if (releaseVersionDir) {
      this.logger.info(`Start to delete ${releaseVersionDir}`);
      const isExist = await this.sftpClient.exists(releaseVersionDir);
      if (isExist) {
        try {
          await this.sftpClient.rmdir(releaseVersionDir, true);
          this.logger.info(`Delete ${releaseVersionDir} successfully`);
        } catch (err: any) {
          this.logger.error(`Failed to delete ${releaseVersionDir}, error is ${err}`);
        }
      }
    }
  }

  async deploy() {
    const startTime = new Date().valueOf();
    let releaseVersionDir = null;
    try {
      this.logger.info('🚀 Starting SFTP deployment...');
      this.logger.info(`Host: ${this.deployOptions.host}:${this.deployOptions.port}`);
      this.logger.info(`Local Dir: ${this.deployOptions.localDir}`);
      this.logger.info(`Remote Dir: ${this.deployOptions.remoteDir}`);
      this.logger.info(`Remote Release Dir: ${this.deployOptions.remoteReleaseDir}`);
      this.logger.info(`Remote current symlink: ${this.deployOptions.currentSymlinkDir}`);
      this.logger.info(`Release Version: ${this.deployOptions.releaseVersion}`);

      // step 1: connect the server
      await this.connect();
      this.logger.done('Connected to server');

      // step 2: create directory structure
      await this.createDirectoryStructure();

      // step 3: generate version
      const releaseVersion = this.deployOptions.releaseVersion;
      this.logger.info(`Starting deployment with release version: ${releaseVersion}`);

      // step 4: upload project to version directory
      releaseVersionDir = path.join(this.deployOptions.remoteReleaseDir, releaseVersion);
      await this.uploadToReleaseDir(releaseVersionDir);

      // step 5: auto switch the version
      await this.execReleaseVersionSwitch(releaseVersionDir);

      // step 6: record success info
      const duration = ((Date.now().valueOf() - startTime) / 1000).toFixed(2);

      this.logger.success(`✨ Deployment ${releaseVersion} completed in ${duration}s`);

      const currentDate = Date.now();

      return {
        success: true,
        version: releaseVersion,
        duration,
        releaseTimestamp: currentDate,
        releaseTime: dayjs(currentDate).format('YYYY-MM-DD HH:mm:ss'),
      };
    } catch (error: any) {
      this.logger.error(`Deployment failed: ${error.message}`);
      await this.deleteReleaseVersionDir(releaseVersionDir);
    } finally {
      await this.disconnect();
      this.logger.done('Disconnected to server');
    }
  }
}

export default SFTPDeployer;
