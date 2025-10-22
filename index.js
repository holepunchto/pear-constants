'use strict'
const { platform, arch, isWindows, isLinux } = require('which-runtime')
const { fileURLToPath } = require('url-file-url')
const sodium = require('sodium-native')
const b4a = require('b4a')
const { CHECKOUT, MOUNT } = require('pear-rti')
const { ALIASES, EOLS } = require('pear-aliases')

const BIN = 'by-arch/' + platform + '-' + arch + '/bin/'
const LOCALDEV = CHECKOUT.length === null
const swapURL = MOUNT.pathname.endsWith('.bundle/')
  ? new URL('..', MOUNT)
  : MOUNT
const swapPath = toPath(swapURL)
const IPC_ID = 'pear'
const PLATFORM_URL = LOCALDEV
  ? new URL('pear/', swapURL)
  : new URL('../../../', swapURL)

const PLATFORM_DIR = toPath(PLATFORM_URL)
const PLATFORM_LOCK = toPath(new URL('platform_lock', PLATFORM_URL))

const RUNTIME_EXEC = isWindows ? 'pear-runtime.exe' : 'pear-runtime'

const WAKEUP_EXEC = isWindows
  ? 'pear.exe'
  : isLinux
    ? 'pear'
    : 'Pear.app/Contents/MacOS/Pear'

exports.LOCALDEV = LOCALDEV
exports.CHECKOUT = CHECKOUT
exports.ALIASES = ALIASES
exports.EOLS = EOLS

exports.SWAP = swapPath
exports.PLATFORM_DIR = PLATFORM_DIR
exports.PLATFORM_LOCK = PLATFORM_LOCK
exports.PLATFORM_HYPERDB = toPath(new URL('db', PLATFORM_URL))
exports.GC = toPath(new URL('gc', PLATFORM_URL))
exports.PLATFORM_CORESTORE = toPath(
  new URL('corestores/platform', PLATFORM_URL)
)
exports.UPGRADE_LOCK = toPath(new URL('lock', PLATFORM_URL))
exports.APPLINGS_PATH = toPath(new URL('applings', PLATFORM_URL))
exports.MOUNT = MOUNT.href.slice(0, -1)
exports.SOCKET_PATH = isWindows
  ? `\\\\.\\pipe\\${IPC_ID}-${pipeId(PLATFORM_DIR)}`
  : `${PLATFORM_DIR}/${IPC_ID}.sock`
exports.BOOT = require.main?.filename

exports.CONNECT_TIMEOUT = 20_000
exports.IDLE_TIMEOUT = 30_000
exports.SPINDOWN_TIMEOUT = 60_000

exports.WAKEUP = toPath(new URL(BIN + WAKEUP_EXEC, swapURL))
exports.RUNTIME = toPath(new URL(BIN + RUNTIME_EXEC, swapURL))

exports.SALT = b4a.from(
  'd134aa8b0631f1193b5031b356d82dbea214389208fa4a0bcdf5c2e062d8ced2',
  'hex'
)

exports.KNOWN_NODES_LIMIT = 100

function toPath(u) {
  return fileURLToPath(u).replace(/[/\\]$/, '') || '/'
}

function pipeId(s) {
  const buf = b4a.allocUnsafe(32)
  sodium.crypto_generichash(buf, b4a.from(s))
  return b4a.toString(buf, 'hex')
}
