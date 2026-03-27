// bun run --filter @couchrift/api dev & bun run --filter @couchrift/web dev
// won't run in Windows — error: Failed to run script dev due to error Background commands "&" are not supported yet.

import { type Subprocess } from 'bun'

const colours = {
  yellow:  (t: string) => `\x1b[33m${t}\x1b[0m`,
  magenta: (t: string) => `\x1b[35m${t}\x1b[0m`,
  cyan:    (t: string) => `\x1b[36m${t}\x1b[0m`,
  green:   (t: string) => `\x1b[32m${t}\x1b[0m`,
  red:     (t: string) => `\x1b[31m${t}\x1b[0m`
}

// Track running processes so they can be killed later
const processes: Subprocess[] = []
let isShuttingDown = false

async function pipeOutput(stream: ReadableStream<Uint8Array>, prefix: string) {
  const decoder = new TextDecoder()
  try {
    for await (const chunk of stream) {
      const text = decoder.decode(chunk)
      // Split by newline and handle each line individually
      const lines = text.split('\n')
      for (const line of lines) {
        const trimmed = line.trimEnd()
        if (trimmed) {
          console.log(`${prefix} ${trimmed}`)
        }
      }
    }
  } catch {
    // Stream closed unexpectedly (as with process kills)
  }
}

async function runCommand(label: string, colorFunc: (t: string) => string, command: string[]) {
  const prefix = `[${colorFunc(label.padEnd(3))}]`
  const proc = Bun.spawn(command, {
    stdout: 'pipe',
    stderr: 'pipe'
  })

  processes.push(proc)

  // Use void to explicitly mark as un-awaited background tasks
  void pipeOutput(proc.stdout, prefix)
  void pipeOutput(proc.stderr, prefix)

  // Detect unexpected exits and report them
  proc.exited.then((code) => {
    if (!isShuttingDown && code !== 0) {
      console.log(colours.red(`\n${prefix} exited unexpectedly (code ${code})`))
    }
  })
}

// Timeout helper — taskkill is fire-and-forget, proc.exited may stall on Windows
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  ])
}

console.log(colours.cyan('Starting development servers...'))
console.log(colours.yellow('Press "q" or Ctrl+C to stop.\n'))

void runCommand('api', colours.yellow, ['bun', 'run', '--filter', '@couchrift/api', 'dev'])
void runCommand('web', colours.magenta, ['bun', 'run', '--filter', '@couchrift/web', 'dev'])

// Clean up process on manual interruption
const cleanup = async () => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(colours.cyan('\n\nStopping all processes...'))

  // Kill all tracked processes
  for (const proc of processes) {
    if (process.platform === 'win32') {
      // On Windows, kill the whole process tree to prevent orphaned processes
      // Use taskkill /F /T /PID to force kill the process and its children.
      try {
        Bun.spawnSync(['taskkill', '/F', '/T', '/PID', proc.pid.toString()], {
          stdout: 'ignore',
          stderr: 'ignore'
        })
      } catch {
        // Process might already be dead
      }
    } else {
      // .kill() sends SIGTERM by default
      proc.kill()
    }
  }

  // Wait for all processes to finish exiting
  await Promise.all(processes.map((p) => withTimeout(p.exited, 2000)))
  
  console.log(colours.green('All processes stopped.'))
  process.exit(0)
}

// Handle keypresses
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.on('data', (data) => {
    const char = data.toString()
    if (char === 'q' || char === '\u0003') { // q or Ctrl+C
      void cleanup()
    }
  })
}

// Handle termination signals
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)