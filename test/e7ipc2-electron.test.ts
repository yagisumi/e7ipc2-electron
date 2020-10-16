import {
  createClient,
  createServer,
  DefineCommands,
  defineHandlers,
  OK,
  ERR,
  CmdHandler,
} from '@/e7ipc2-electron'
import { Mock } from './mock'

type Commands = DefineCommands<{
  hello: {
    ret: string
  }
  buy: {
    opts: {
      item: string
      num?: number
    }
    ret: {
      item: string
      num: number
    }
  }
}>

const helloHandler: CmdHandler<Commands, 'hello'> = async (_ev, _opts) => {
  return OK('hello')
}

const handler = defineHandlers<Commands>({
  hello: helloHandler,
  buy: async (_ev, opts) => {
    const num = opts.num ?? 1
    return OK({
      item: opts.item,
      num,
    })
  },
})

describe('Client, Server', () => {
  test('normal request', async () => {
    const mock = new Mock()
    const client = createClient<Commands>('test', mock as any)
    const server = createServer<Commands>('test', mock as any)

    server.handle(handler)

    const r1 = await client.invoke({ $cmd: 'hello' }).catch(ERR)
    expect(r1).toEqual(OK('hello'))

    const r2 = await client.invoke({ $cmd: 'buy', item: 'book' }).catch(ERR)
    expect(r2).toEqual(OK({ item: 'book', num: 1 }))
  })

  test('handle, removeHandler, handleOnce', async () => {
    const mock = new Mock()
    const client = createClient<Commands>('test', mock as any)
    const server = createServer<Commands>('test', mock as any)

    const r1 = await client.invoke({ $cmd: 'hello' }).catch(ERR)
    // error: Error: No handler registered for 'test'
    expect(r1.ok).toBe(false)
    expect(r1.error).toBeInstanceOf(Error)

    server.handleOnce(handler)
    expect(() => {
      server.handle(handler)
    }).toThrowError()

    const r2 = await client.invoke({ $cmd: 'hello' })
    expect(r2).toEqual(OK('hello'))

    const r3 = await client.invoke({ $cmd: 'hello' }).catch(ERR)
    // error: Error: No handler registered for 'test'
    expect(r3.ok).toBe(false)
    expect(r3.error).toBeInstanceOf(Error)
  })
})
