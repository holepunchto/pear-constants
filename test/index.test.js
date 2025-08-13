// test/constants.test.js
'use strict'

const test = require('brittle')
const { platform, arch, isWindows, isLinux } = require('which-runtime')
const { fileURLToPath } = require('url-file-url')
const sodium = require('sodium-native')
const b4a = require('b4a')
class API {
  static RTI = { checkout: { fork: null, length: null, key: '/some/path' } }
}
global.Pear = new API()
const { CHECKOUT, MOUNT } = require('pear-rti')
const constants = require('..')

const BIN = `by-arch/${platform}-${arch}/bin/`
const LOCALDEV = CHECKOUT && CHECKOUT.length === null
const swapURL = MOUNT.pathname.endsWith('.bundle/') ? new URL('..', MOUNT) : MOUNT
const toPath = u => fileURLToPath(u).replace(/[/\\]$/, '') || '/'
const PLATFORM_URL = LOCALDEV ? new URL('pear/', swapURL) : new URL('../../../', swapURL)
const RUNTIME_EXEC = isWindows ? 'pear-runtime.exe' : 'pear-runtime'
const WAKEUP_EXEC = isWindows ? 'pear.exe' : isLinux ? 'pear' : 'Pear.app/Contents/MacOS/Pear'

test('derived paths match implementation', (t) => {
  const expSwap = toPath(swapURL)
  const expPlatformDir = toPath(PLATFORM_URL)
  const expPlatformLock = toPath(new URL('corestores/platform/db/LOCK', PLATFORM_URL))
  const expRuntime = toPath(new URL(BIN + RUNTIME_EXEC, swapURL))
  const expWakeup = toPath(new URL(BIN + WAKEUP_EXEC, swapURL))
  const expMountHref = MOUNT.href.slice(0, -1)

  t.is(constants.SWAP, expSwap)
  t.is(constants.PLATFORM_DIR, expPlatformDir)
  t.is(constants.PLATFORM_LOCK, expPlatformLock)
  t.is(constants.RUNTIME, expRuntime)
  t.is(constants.WAKEUP, expWakeup)
  t.is(constants.MOUNT, expMountHref)
})

test('timeouts and limits', (t) => {
  t.is(constants.CONNECT_TIMEOUT, 20_000)
  t.is(constants.IDLE_TIMEOUT, 30_000)
  t.is(constants.SPINDOWN_TIMEOUT, 60_000)
  t.is(constants.KNOWN_NODES_LIMIT, 100)
})

test('LOCALDEV flag and platform url mode', (t) => {
  t.is(constants.LOCALDEV, LOCALDEV)
  if (LOCALDEV) {
    t.is(constants.PLATFORM_DIR, toPath(new URL('pear/', swapURL)))
  } else {
    t.is(constants.PLATFORM_DIR, toPath(new URL('../../../', swapURL)))
  }
})

test('SALT buffer equals expected hex', (t) => {
  const hex = 'd134aa8b0631f1193b5031b356d82dbea214389208fa4a0bcdf5c2e062d8ced2'
  t.alike(Buffer.from(constants.SALT), Buffer.from(hex, 'hex'))
})

test('socket path hashing and scheme', (t) => {
  const buf = b4a.allocUnsafe(32)
  sodium.crypto_generichash(buf, b4a.from(constants.PLATFORM_DIR))
  const id = b4a.toString(buf, 'hex')

  if (isWindows) {
    t.is(constants.SOCKET_PATH, `\\\\.\\pipe\\pear-${id}`)
  } else {
    t.ok(constants.SOCKET_PATH.endsWith('/pear.sock'))
    t.ok(constants.SOCKET_PATH.startsWith(constants.PLATFORM_DIR))
  }
})

test('executables chosen per platform', (t) => {
  if (isWindows) {
    t.ok(constants.RUNTIME.endsWith('\\pear-runtime.exe'))
    t.ok(constants.WAKEUP.endsWith('\\pear.exe'))
  } else if (isLinux) {
    t.ok(constants.RUNTIME.endsWith('/pear-runtime'))
    t.ok(constants.WAKEUP.endsWith('/pear'))
  } else {
    t.ok(constants.RUNTIME.endsWith('/pear-runtime'))
    t.ok(constants.WAKEUP.endsWith('/Pear.app/Contents/MacOS/Pear'))
  }
})

test('mount .bundle parent handling (conditional)', (t) => {
  const expectedSwap = MOUNT.pathname.endsWith('.bundle/')
    ? toPath(new URL('..', MOUNT))
    : toPath(MOUNT)

  t.is(constants.SWAP, expectedSwap)
})
