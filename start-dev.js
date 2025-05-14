import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Function to start a process
function startProcess(command, args, name) {
  console.log(`Starting ${name}...`);
  
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    cwd: __dirname
  });
  
  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });
  
  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`[${name} ERROR] ${output}`);
    }
  });
  
  proc.on('close', (code) => {
    console.log(`${name} process exited with code ${code}`);
  });
  
  return proc;
}

// Start the backend server
const backendProcess = startProcess('node', ['server.js'], 'Backend');

// Start the frontend development server
const frontendProcess = startProcess('npm', ['run', 'dev'], 'Frontend');

// Handle termination
process.on('SIGINT', () => {
  console.log('Shutting down all processes...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});
