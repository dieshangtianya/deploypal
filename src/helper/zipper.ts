import AdmZip from 'adm-zip';
import fs from 'fs/promises';

const compressDirectory = async (dir: string, outputFile: string) => {
  if (!dir) {
    throw new Error('invalid directory path');
  }
  if (!outputFile) {
    throw new Error('invalid output file name');
  }
  let statInfo;
  try {
    statInfo = await fs.stat(dir);
  } catch {
    throw new Error('dir path not exist');
  }

  if (!statInfo.isDirectory) {
    throw new Error('dir path is not a directory');
  }
  const zip = new AdmZip();
  zip.addLocalFolder(dir);
  zip.writeZip(outputFile);
};

const compressFiles = async (files: string[], outputFile: string) => {
  if (!files || files.length === 0) {
    return;
  }
  const zip = new AdmZip();
  files.forEach((file) => {
    zip.addLocalFile(file);
  });
  zip.writeZip(outputFile);
};

export default { compressDirectory, compressFiles };
