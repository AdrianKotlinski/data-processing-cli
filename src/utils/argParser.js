export function parseArgs(tokens) {
  const args = {};
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].startsWith('--')) {
      const key = tokens[i].slice(2);
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('--')) {
        args[key] = tokens[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}
