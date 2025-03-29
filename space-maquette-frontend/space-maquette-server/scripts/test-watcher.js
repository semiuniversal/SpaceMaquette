const chokidar = require('chokidar');
const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

// Paths relative to server project
const srcDir = path.resolve(__dirname, '../src');
const testsDir = path.resolve(__dirname, '../tests');

let testRunning = false;
let testQueued = false;

// Run tests
function runTests() {
  if (testRunning) {
    testQueued = true;
    return;
  }
  
  testRunning = true;
  testQueued = false;
  
  console.log(chalk.cyan('🧪 Running server tests...'));
  
  // Use npm test or your preferred test command
  const testProcess = spawn('npm', ['test'], {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  testProcess.on('close', (code) => {
    testRunning = false;
    
    if (code === 0) {
      console.log(chalk.green('✅ Server tests completed successfully'));
    } else {
      console.log(chalk.red(`❌ Server tests failed with code ${code}`));
    }
    
    if (testQueued) {
      setTimeout(runTests, 100);
    }
  });
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

const debouncedRunTests = debounce(runTests, 500);

// Setup file watcher
console.log(chalk.cyan('🔍 Setting up server file watcher...'));

const watcher = chokidar.watch([
  path.join(srcDir, '**/*.{js,ts}'),
  path.join(testsDir, '**/*.{js,ts}')
], {
  ignored: /(node_modules|\.git)/,
  persistent: true
});

watcher
  .on('ready', () => console.log(chalk.green('✅ Server file watcher ready')))
  .on('change', path => {
    console.log(chalk.yellow(`📄 File changed: ${path}`));
    debouncedRunTests();
  });

process.on('SIGINT', () => {
  console.log(chalk.yellow('👋 Test watcher stopped'));
  process.exit(0);
}); 