interface DeployPalConfig {
  host: string;
  port: number;
  userName: string;
  authType: string;
  sshKeyPath?: string;
  passphrase?: string;
  password?: string;
  useSymlink: boolean;
  currentSymlink: string;
  localDir: string;
  remoteDir: string;
  enableCompression?: boolean;
}

interface DeployCommandOptions {
  name: string;
  host: string;
  port: number;
  userName: string;
  authType: string;
  sshPrivateKey?: string;
  passphrase?: string;
  password?: string;
  releaseVersion: string;
  useSymlink: boolean;
  currentSymlink: string;
  localDir: string;
  remoteDir: string;
  environment: string;
  enableCompression: boolean;
}

interface DeployOptions extends DeployCommandOptions {
  remoteReleaseDir: string;
  currentSymlinkDir: string;
}

interface ProgramOptions {
  debug: boolean;
  verbose: boolean;
}

interface ILogger {
  done(...restParam: any[]): void;
  info(...restParam: any[]): void;
  log(...restParam: any[]): void;
  success(...restParam: any[]): void;
  error(...restParam: any[]): void;
  warn(...restParam: any[]): void;
  verbose(...restParam: any[]): void;
  debug(...restParam: any[]): void;
}

interface FileBasicInfo {
  path: string;
  size: number;
}

interface FileBasInfo {
  path: string;
  size: number;
}

declare module 'adm-zip' {
  const AdmZip: {
    new (): any;
  };
  export default AdmZip;
}
