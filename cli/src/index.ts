#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { program } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import fetch from 'node-fetch';
import ora from 'ora';
import { join } from 'node:path';

// Read package.json for version info
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

const MOTION_PRIMITIVES_REGISTRY_URL =
  'https://ui.ndekocode.dev/c/registry.json';
const MOTION_PRIMITIVES_BASE_URL =
  'https://ui.ndekocode.dev/';
const TARGET_DIR = 'components/ndekoui';

interface FileEntry {
  path: string;
  type: string;
  content?: string;
}

interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[]; // Kept for reference, not used here
  files: FileEntry[];
}

interface Registry {
  items: RegistryItem[];
}

async function fetchRegistry(url: string): Promise<Registry> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch registry from ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchFile(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.status}`);
  }
  return response.text();
}

// Detect package manager (npm, yarn, pnpm)
function detectPackageManager(): string {
  try {
    // Check for yarn.lock or package-lock.json
    if (existsSync('yarn.lock')) {
      return 'yarn';
    } else if (existsSync('pnpm-lock.yaml')) {
      return 'pnpm';
    } else {
      return 'npm'; // Default to npm
    }
  } catch (error: unknown) {
    console.warn('Error detecting package manager:', error);
    return 'npm'; // Default to npm on error
  }
}

// Install dependencies using detected package manager
function installDependencies(dependencies: string[]): boolean {
  const packageManager = detectPackageManager();
  const spinner = ora('Installing dependencies...').start();

  try {
    const installCommand =
      packageManager === 'yarn'
        ? `yarn add ${dependencies.join(' ')}`
        : packageManager === 'pnpm'
          ? `pnpm add ${dependencies.join(' ')}`
          : `npm install ${dependencies.join(' ')}`;

    execSync(installCommand, { stdio: 'ignore' });
    spinner.succeed(
      `Dependencies installed successfully with ${packageManager}`
    );
    return true;
  } catch (error) {
    spinner.fail(`Failed to install dependencies: ${error}`);
    console.log('\nPlease install them manually:');
    console.log(
      `${packageManager === 'yarn' ? 'yarn add' : packageManager === 'pnpm' ? 'pnpm add' : 'npm install'} ${dependencies.join(' ')}`
    );
    return false;
  }
}

// Display the welcome banner
function displayBanner() {
  console.log(`
┌────────────────────────────────────────────┐
│                                            │
│           Ndeko UI  CLI            │
│                                            │
│      Beautiful, animated components        │
│          for your React projects           │
│                                            │
│              Version: ${packageJson.version}               │
│                                            │
└────────────────────────────────────────────┘
  `);
}

program
  .name('ndekoui')
  .description('CLI to add beautiful, animated components to your app')
  .version(packageJson.version);

program
  .command('add')
  .argument('<component>', 'The component to add (e.g., accordion, text-morph)')
  .description('Add a ndekoui component to your project')
  .action(async (component: string) => {
    const spinner = ora(`Adding ${component}...`).start();

    try {
      // Fetch the ndekoui registry
      const motionPrimitivesRegistry = await fetchRegistry(
        MOTION_PRIMITIVES_REGISTRY_URL
      );
      const componentEntry = motionPrimitivesRegistry.items.find(
        (item) => item.name === component
      );
      if (!componentEntry) {
        spinner.fail(`Component "${component}" not found in ndekoui registry`);
        console.log('\nRun "npx ndekoui list" to see all available components');
        process.exit(1);
      }

      // Collect all files and dependencies
      const allFiles: { path: string; content: string }[] = [];
      const allDependencies: Set<string> = new Set(
        componentEntry.dependencies || []
      );

      // Process all files from registry.json
      for (const file of componentEntry.files) {
        const content =
          file.content ||
          (await fetchFile(`${MOTION_PRIMITIVES_BASE_URL}${file.path}`));
        const fileName = file.path.split('/').pop()!;
        allFiles.push({ path: fileName, content });
      }

      // Create target directory if it doesn't exist
      if (!existsSync(TARGET_DIR)) {
        mkdirSync(TARGET_DIR, { recursive: true });
      }

      // Write all files to components/ndekoui/
      for (const { path, content } of allFiles) {
        const filePath = join(TARGET_DIR, path);
        writeFileSync(filePath, content);
        console.log(`✓ Added ${path} to ${filePath}`);
      }

      spinner.succeed(`Component "${component}" added successfully!`);

      // Install dependencies automatically
      const depsArray = Array.from(allDependencies);
      if (depsArray.length > 0) {
        installDependencies(depsArray);

        // Add usage example
        if (componentEntry.title) {
          const pascalCaseName = component
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

          console.log('\nExample usage:');
          console.log('```jsx');
          console.log(
            `import { ${pascalCaseName} } from '@/components/ndekoui/${component}'; // or 'ndekoui/${component}';`
          );
          console.log('\n// Then in your JSX:');
          console.log(`<${pascalCaseName} />`);
          console.log('```');
        }
      } else {
        console.log('No additional dependencies needed.');
      }
    } catch (error: any) {
      spinner.fail(`Error: ${error.message || error}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available ndekoui components')
  .action(async () => {
    const spinner = ora('Fetching components...').start();

    try {
      // Fetch the ndekoui registry
      const motionPrimitivesRegistry = await fetchRegistry(
        MOTION_PRIMITIVES_REGISTRY_URL
      );

      spinner.succeed(
        `Found ${motionPrimitivesRegistry.items.length} components`
      );

      console.log('\nAvailable components:');
      console.log('====================\n');

      for (const item of motionPrimitivesRegistry.items) {
        console.log(`${item.name} - ${item.title}`);
        if (item.description) {
          console.log(`  ${item.description}`);
        }
        if (item.dependencies && item.dependencies.length > 0) {
          console.log(`  Dependencies: ${item.dependencies.join(', ')}`);
        }
        console.log('');
      }

      console.log('\nTo add a component run:');
      console.log('  npx ndekoui add <component-name>');
    } catch (error: any) {
      spinner.fail(`Error: ${error.message || error}`);
      process.exit(1);
    }
  });

// Add a default command if no command is provided
program.action(() => {
  displayBanner();
  console.log(
    'A tool for adding beautiful, animated components to your React app\n'
  );
  console.log('Available commands:');
  console.log('  add <component>  - Add a component to your project');
  console.log('    Example: npx ndekoui add text-morph');
  console.log('\n  list             - List all available components');
  console.log('    Example: npx ndekoui list');
  console.log('\n  --help           - Show help information');
  console.log('\nDocumentation: https://github.com/ndekocode/ndekoui');
});

program.parse(process.argv);
