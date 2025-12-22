import BaseSFTPClient from 'ssh2-sftp-client';

interface ISFTPClient {
  client: any;
}

export default class SFTPClient extends BaseSFTPClient implements ISFTPClient {
  client: any;
  lstat: any;
  static ErrorCode = {
    generic: 'ERR_GENERIC_CLIENT',
    connect: 'ERR_NOT_CONNECTED',
    badPath: 'ERR_BAD_PATH',
    permission: 'EACCES',
    notexist: 'ENOENT',
    notdir: 'ENOTDIR',
    badAuth: 'ERR_BAD_AUTH',
  };

  async symlink(source: string, target: string, force = false) {
    if (!this.client) {
      throw new Error('SFTP client has not connected to server');
    }

    const forceFlag = force ? '-f' : '';
    const command = `ln -s ${forceFlag} "${source}" "${target}"`;

    return new Promise((resolve, reject) => {
      this.client.exec(command, (err: any, stream: any) => {
        if (err) {
          reject(new Error(`exec command error: ${err.message}`));
          return;
        }

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code: number) => {
            if (code === 0) {
              resolve(true);
            } else {
              reject(new Error(`create symlink failed (${code}):\nstdout: ${stdout}\nstderr: ${stderr}`));
            }
          })
          .on('data', (data: any) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: any) => {
            stderr += data.toString();
          });
      });
    });
  }

  async unlink(target: string, force = false) {
    if (!this.client) {
      throw new Error('SFTP client has not connected to server');
    }

    // remove symlink with rm command
    const forceFlag = force ? '-f' : '';
    const command = `rm ${forceFlag} "${target}"`;

    return new Promise((resolve, reject) => {
      this.client.exec(command, (err: any, stream: any) => {
        if (err) {
          reject(new Error(`exec command error: ${err.message}`));
          return;
        }

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code: number) => {
            if (code === 0) {
              resolve(true);
            } else {
              reject(new Error(`remove symlink failed (${code}):\nstdout: ${stdout}\nstderr: ${stderr}`));
            }
          })
          .on('data', (data: any) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: any) => {
            stderr += data.toString();
          });
      });
    });
  }

  async readlink(linkPath: string) {
    if (!this.client) {
      throw new Error('SFTP client has not connected to server');
    }

    return new Promise((resolve, reject) => {
      this.client.exec(`readlink "${linkPath}"`, (err: any, stream: any) => {
        if (err) {
          reject(new Error(`exec command error: ${err.message}`));
          return;
        }

        let stdout = '';
        let stderr = '';

        stream
          .on('close', (code: number) => {
            if (code === 0) {
              resolve(stdout.trim());
            } else {
              reject(new Error(`read symlink error: ${stderr}`));
            }
          })
          .on('data', (data: any) => {
            stdout += data.toString();
          })
          .stderr.on('data', (data: any) => {
            stderr += data.toString();
          });
      });
    });
  }
}
