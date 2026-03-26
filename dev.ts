// bun run --filter @couchrift/api dev & bun run --filter @couchrift/web dev
// won't run in Windows — error: Failed to run script dev due to error Background commands "&" are not supported yet.

import { type Subprocess } from 'bun'

const colours = {
  normal: '\x1b[0m',
  yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
  magenta: (t: string) => `\x1b[35m${t}\x1b[0m`,
  cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
  green: (t: string) => `\x1b[32m${t}\x1b[0m`,
  red: (t: string) => `\x1b[31m${t}\x1b[0m`
}

// Track running processes so they can be killed later
const processes: Subprocess[] = []

async function pipeOutput(stream: ReadableStream<Uint8Array>, prefix: string) {
  const decoder = new TextDecoder()
  try {
    for await (const chunk of stream) {
      console.log(`${prefix} ${decoder.decode(chunk).trimEnd()}`)
    }
  } catch {
    // Stream closed unexpectedly (as with process kills)
  }
}

async function runCommand(label: string, colorFunc: (t: string) => string, command: string[]) {
  const prefix = `[${colorFunc(label.padEnd(6))}]`
  const proc = Bun.spawn(command, {
    stdout: 'pipe',
    stderr: 'pipe'
  })

  processes.push(proc)

  // use void to explicitly mark as un-awaited background tasks
  void pipeOutput(proc.stdout, prefix)
  void pipeOutput(proc.stderr, prefix)

  // Monitor the process for exit
  void proc.exited.then((code) => {
    const status = code === 0 ? colours.green('exited') : colours.red(`failed with code: ${code}`)
    console.log(`${prefix} ${label} ${status}`)
  })
}

console.log(colours.cyan('Starting development servers...'))

void runCommand('api', colours.yellow, ['bun', 'run', '--filter', '@couchrift/api', 'dev'])
void runCommand('web', colours.magenta, ['bun', 'run', '--filter', '@couchrift/web', 'dev'])

// Clean up process on manual interruption
const cleanup = async () => {
  console.log(colours.cyan('\n\nStopping all processes...'))

  // Kill all tracked processes
  for (const proc of processes) {
    // .kill() sends SIGTERM by default
    proc.kill()
  }

  await Promise.all(processes.map((p) => p.exited))
  process.exit(0)
}

// Handle CTRL+C (SIGINT) and other termination signals
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)