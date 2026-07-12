import { app, BrowserWindow } from 'electron'
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const softwareRoot = resolve(here, '..')
const firmwareRoot = resolve(softwareRoot, '..', '..', 'firmware')
let backend: ChildProcess | undefined
let backendStopping = false

function formatBackendOutput(data: Buffer): string {
  const text = String(data).replace(/\s+$/, '')

  if (!text) return ''

  if (text.includes('\n')) {
    return `[backend]\n${text}\n`
  }

  return `[backend] ${text}\n`
}

function pythonExecutable(): string {
  if (process.env.SENSEDIAL_PYTHON) return process.env.SENSEDIAL_PYTHON
  const candidates = [
    join(firmwareRoot, 'tools', '.venv', 'bin', 'python3'),
    join(firmwareRoot, 'tools', '.venv', 'bin', 'python'),
    'python3',
  ]
  return candidates.find((candidate) => candidate === 'python3' || existsSync(candidate)) ?? 'python3'
}

async function backendIsAvailable(): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:8765/api/health', {
      signal: AbortSignal.timeout(350),
    })
    if (!response.ok) return false

    return true
  } catch {
    return false
  }
}

async function stopExistingBackend(): Promise<void> {
  if (!await backendIsAvailable()) return
  await fetch('http://127.0.0.1:8765/api/shutdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(1000),
  }).catch(() => undefined)

  const deadline = Date.now() + 2500
  while (Date.now() < deadline) {
    if (!await backendIsAvailable()) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Previous SenseDial backend did not release port 8765')
}

async function startBackend() {
  await stopExistingBackend()

  backend = spawn(pythonExecutable(), [join(softwareRoot, 'backend', 'server.py')], {
    cwd: firmwareRoot,
    env: { ...process.env, SENSEDIAL_BACKEND_PORT: '8765' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  backend.stdout?.on('data', (data: Buffer) => process.stdout.write(formatBackendOutput(data)))
  backend.stderr?.on('data', (data: Buffer) => process.stderr.write(formatBackendOutput(data)))
  backend.on('exit', () => { backend = undefined })
}

async function stopBackend() {
  if (backendStopping) return
  backendStopping = true
  try {
    await fetch('http://127.0.0.1:8765/api/shutdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(700),
    })
  } catch {
    // The backend may already be gone; fall through to process termination.
  }
  const processToStop = backend
  if (processToStop && processToStop.exitCode === null) {
    processToStop.kill('SIGTERM')
    setTimeout(() => {
      if (processToStop.exitCode === null) processToStop.kill('SIGKILL')
    }, 1200).unref()
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#07110f',
    webPreferences: { contextIsolation: true, sandbox: true },
  })
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) void window.loadURL(devUrl)
  else void window.loadFile(join(softwareRoot, 'dist', 'index.html'))
}

app.whenReady().then(async () => {
  await startBackend()
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', (event) => {
  if (backendStopping) return
  event.preventDefault()
  void stopBackend().finally(() => app.quit())
})

app.on('will-quit', () => {
  void stopBackend()
})
