import crypto from 'crypto';

export const createUUID = () => {
  return crypto.randomBytes(8).toString('hex');
};
