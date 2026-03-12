import path from 'path';

export default function resolvePath(cwd, filePath) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(cwd, filePath);
}
