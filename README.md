# @yagisumi/e7ipc2-electron

Welcome

[![NPM version][npm-image]][npm-url] [![install size][packagephobia-image]][packagephobia-url] [![TypeScript][typescript-image]][typescript-url]  
[![Build Status][githubactions-image]][githubactions-url] [![Coverage percentage][coveralls-image]][coveralls-url]
<!--- [![Build Status][travis-image]][travis-url] [![Build Status][appveyor-image]][appveyor-url] -->

## Installation

```sh
$ npm i @yagisumi/e7ipc2-electron
```

## Requirements

`electron` v7 or later

## Usage

Simply put, the library executes the command with `invoke` and 
receives a response of type `Promise<Result<T>>`.

### `type Result`

```ts
type Result<T> = OK<T> | ERR
type OK<T> = {
  ok: true
  error: undefined
  value: T
}
type ERR = {
  ok: false
  error: Error
  value: undefined
}
```

### Define Commands

Define commands with `DefineCommands`.  
The argument of the command is specified by `opts`, 
and the return value is specified by `ret`. `opts` can be omitted.  
Here, we also define the channel to be used in `ipcMain`.

```ts
// commands.ts
import type { DefineCommands } from '@yagisumi/e7ipc2-electron';

export const CHANNEL = 'app'

export type Commands = DefineCommands<{
  hello: {
    opts: {
      name?: string
    }
    ret: string
  }
  foo: {
    ret: {
      bar: number
      baz: number
    }
  }
}>
```

### Define Handlers

Define an handler with `defineHandlers`.  
The return value is returned by `OK()`.
If an error occurs, it returns an error by `ERR()`.  

```ts
// handlers.ts
import { defineHandlers, CmdHandler, OK, ERR } from '@yagisumi/e7ipc2-electron'
import { Commands } from './commands'

const helloHandler: CmdHandler<Commands, 'hello'> = async (_ev, opts) => {
  const name = opts.name ?? 'World'
  return OK(`Hello ${name}!`)
}

const fooHandler: CmdHandler<Commands, 'foo'> = async (_ev, _opts) => {
  const v = Math.random()
  if (v > 0.5) {
    return OK({
      bar: v,
      baz: 1,
    })
  } else {
    return ERR(new Error('puzzling error'))
  }
}

export const handlers = defineHandlers<Commands>({
  hello: helloHandler,
  foo: fooHandler,
})
```

### Create a server in Electron's main process

Create a server with `createServer` and add an handler.  
The server here is a simple wrapper for [`ipcMain`](https://www.electronjs.org/docs/api/ipc-main).

```ts
import { CHANNEL, Commands } from './lib/commands'
import { handlers } from './lib/handlers'
import { createServer } from '@yagisumi/e7ipc2-electron'
import { ipcMain } from 'electron'

const server = createServer<Commands>(CHANNEL, ipcMain)
server.handle(handlers)
```

### Create a client in Electron's renderer process

Create the client with `createClient` and execute the command with `invoke`.<br>

```ts
client.invoke({
  $cmd: `command name`,
  ...other options
})
```

#### Define API

```ts
// api.ts
import { CHANNEL, Commands } from './commands'
import { createClient, ERR } from '@yagisumi/e7ipc2-electron'
import { ipcRenderer } from 'electron'

const client = createClient<Commands>(CHANNEL, ipcRenderer)

export const api = {
  hello: async (name?: string) => {
    return client.invoke({ $cmd: 'hello', name }).catch(ERR)
  },
  foo: async () => {
    return client.invoke({ $cmd: 'foo' }).catch(ERR)
  },
}

export type ApiType = typeof api
```

#### Expose API

```ts
// preload.ts
import { contextBridge } from 'electron'
import { api } from './api'

contextBridge.exposeInMainWorld('api', api)
```

#### Define API window

```ts
// api-window.ts
import type { ApiType } from './api'
declare const window: Window & typeof globalThis & { api: ApiType }
export default window
```

### How to use

```ts
import window from './api-window'

async funtion example() {
  await window.api.hello('Dolly') // => {ok: true, error: undefined, value: "Hello Dolly!"}

  await window.api.foo() // => {ok: true, error: undefined, value: {bar: 0.6038104610635642, baz: 1}}
  await window.api.foo() // => {ok: false, error: Error: Uncaught Error: puzzling error, value: undefined}
}
```

## License

[MIT License](https://opensource.org/licenses/MIT)

[githubactions-image]: https://img.shields.io/github/workflow/status/yagisumi/node-e7ipc2-electron/build?logo=github&style=flat-square
[githubactions-url]: https://github.com/yagisumi/node-e7ipc2-electron/actions
[npm-image]: https://img.shields.io/npm/v/@yagisumi/e7ipc2-electron.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@yagisumi/e7ipc2-electron
[packagephobia-image]: https://flat.badgen.net/packagephobia/install/@yagisumi/e7ipc2-electron
[packagephobia-url]: https://packagephobia.now.sh/result?p=@yagisumi/e7ipc2-electron
[travis-image]: https://img.shields.io/travis/yagisumi/node-e7ipc2-electron.svg?style=flat-square
[travis-url]: https://travis-ci.org/yagisumi/node-e7ipc2-electron
[appveyor-image]: https://img.shields.io/appveyor/ci/yagisumi/node-e7ipc2-electron.svg?logo=appveyor&style=flat-square
[appveyor-url]: https://ci.appveyor.com/project/yagisumi/node-e7ipc2-electron
[coveralls-image]: https://img.shields.io/coveralls/yagisumi/node-e7ipc2-electron.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/yagisumi/node-e7ipc2-electron?branch=master
[typescript-image]: https://img.shields.io/badge/TypeScript-.d.ts-555?logo=typescript&labelColor=007ACC&style=flat-square
[typescript-url]: https://www.typescriptlang.org/
