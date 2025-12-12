export type RegistryItemType =
  | 'registry:ui'
  | 'registry:lib'
  | 'registry:hook'
  | 'registry:component'
  | 'registry:block'
  | 'registry:example';

export type RegistryItemFile = {
  path: string;
  type: RegistryItemType;
  target?: string;
};

export type RegistryItemDefinition = {
  name: string;
  type: RegistryItemType;
  title: string;
  description: string;
  files: RegistryItemFile[];
  dependencies?: string[];
  registryDependencies?: string[];
  categories: string[];
};

export const BASE_UI = '@base-ui/react';
export const CVA = 'class-variance-authority';

export function uiFile(name: string): RegistryItemFile {
  return { path: `registry/ndeko/ui/${name}.tsx`, type: 'registry:ui' };
}

export function primitive(
  name: string,
  title: string,
  description: string,
  options: {
    dependencies?: string[];
    registryDependencies?: string[];
    categories?: string[];
  } = {}
): RegistryItemDefinition {
  const ownDependencies = options.registryDependencies ?? [];
  return {
    name,
    type: 'registry:ui',
    title,
    description,
    files: [uiFile(name)],
    dependencies: options.dependencies,
    registryDependencies: ['theme', 'utils', ...ownDependencies],
    categories: options.categories ?? ['primitives'],
  };
}
