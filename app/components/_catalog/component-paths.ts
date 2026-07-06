export function fullPagePathOf(category: string, name: string) {
  return `/view/components/${category}/${name}`;
}

export function catalogAnchorPathOf(category: string, name: string) {
  return `/components/${category}#${name}`;
}
