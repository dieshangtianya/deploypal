import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function getFiles(dirPath: string) {
  const files: Array<FileBasInfo> = [];
  const absoluteDirPath = path.resolve(dirPath);
  const entries = await fs.readdir(absoluteDirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(absoluteDirPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const fileStat = await fs.stat(fullPath);
      files.push({
        path: fullPath,
        size: fileStat.size,
      });
    }
  }
  return files;
}

export async function readFile(filePath: string) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return fileContent;
  } catch {
    return null;
  }
}

export async function isFileExist(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function resolveSSHKeyPath(filePath: string) {
  const home = os.homedir();

  // process Unix/Linux/Mac ~
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(home, filePath.slice(1));
  }

  // process Windows ~ 和 %USERPROFILE%
  if (process.platform === 'win32') {
    if (filePath.startsWith('~\\') || filePath === '~') {
      return path.join(home, filePath.slice(1));
    }
    // process window variables
    if (filePath.startsWith('%USERPROFILE%')) {
      return filePath.replace(/%USERPROFILE%/g, home);
    }
  }

  return path.resolve(filePath);
}
