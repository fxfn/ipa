export function kebabCase(str: string) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-(\w)/, '$1')
}

export function pascalCase(str: string) {
  // If the string is already in PascalCase (starts with uppercase and has camelCase structure)
  if (/^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(str)) {
    return str
  }
  
  return str
    .toLowerCase()
    .replace(/(?:^|\s|_|-)(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}