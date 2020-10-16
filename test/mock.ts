type Handler = (ev: unknown, ...args: any[]) => any

export class Mock {
  private handlers = new Map<string, Handler>()

  invoke(channel: string, ...args: any[]) {
    const handler = this.handlers.get(channel)
    if (handler === undefined) {
      return Promise.reject(new Error(`No handler registered for '${channel}'`))
    } else {
      return handler({}, ...args)
    }
  }

  handle(channel: string, listener: Handler) {
    const handler = this.handlers.get(channel)
    if (handler !== undefined) {
      throw new Error('Attempted to register a second handler')
    }
    this.handlers.set(channel, listener)
  }

  handleOnce(channel: string, listener: Handler) {
    this.handle(channel, (ev, ...args) => {
      this.removeHandler(channel)
      return listener(ev, ...args)
    })
  }

  removeHandler(channel: string) {
    this.handlers.delete(channel)
  }
}
