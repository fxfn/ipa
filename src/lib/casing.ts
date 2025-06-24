export function kebabCase(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-(\w)/, '$1')
}

export function pascalCase(str: string) {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|_|-)(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}