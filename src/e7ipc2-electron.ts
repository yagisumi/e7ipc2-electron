export { Result, OK, ERR, DefineCommands } from '@yagisumi/e7ipc2-types'
import {
  Result,
  Listener,
  Server,
  Client,
  CommandsSpec,
  defineHandlers as defineHandlersOrig,
  Handlers,
  CmdHandler as CmdHandlerOrig,
} from '@yagisumi/e7ipc2-types'
import type { IpcMain, IpcRenderer, IpcMainInvokeEvent } from 'electron'

export type CmdHandler<Cmds extends CommandsSpec, CmdName extends keyof Cmds> = CmdHandlerOrig<
  Cmds,
  CmdName,
  IpcMainInvokeEvent
>

export const defineHandlers = defineHandlersOrig as <Cmds extends CommandsSpec>(
  handlers: Handlers<Cmds, IpcMainInvokeEvent>
) => Listener<Cmds, IpcMainInvokeEvent>

class IpcRendererClient<Cmds extends CommandsSpec> implements Client<Cmds> {
  private channel: string
  private ipcRenderer: IpcRenderer

  constructor(channel: string, ipcRenderer: IpcRenderer) {
    this.ipcRenderer = ipcRenderer
    this.channel = channel
  }

  invoke<CmdName extends keyof Cmds = keyof Cmds>(
    opts: Cmds[CmdName]['opts'] & { $cmd: CmdName }
  ): Promise<Result<Cmds[CmdName]['ret']>> {
    return this.ipcRenderer.invoke(this.channel, opts)
  }
}

class IpcMainServer<Cmds extends CommandsSpec> implements Server<Cmds> {
  private channel: string
  private ipcMain: IpcMain

  constructor(channel: string, ipcMain: IpcMain) {
    this.ipcMain = ipcMain
    this.channel = channel
  }

  handle(listner: Listener<Cmds>) {
    this.ipcMain.handle(this.channel, listner)
  }

  handleOnce(listner: Listener<Cmds>) {
    this.handle((ev, req) => {
      this.removeHandler()
      return listner(ev, req)
    })
  }

  removeHandler() {
    this.ipcMain.removeHandler(this.channel)
  }
}

export function createClient<Cmds extends CommandsSpec>(channel: string, ipcRenderer: IpcRenderer) {
  return new IpcRendererClient<Cmds>(channel, ipcRenderer)
}

export function createServer<Cmds extends CommandsSpec>(channel: string, ipcMain: IpcMain) {
  return new IpcMainServer<Cmds>(channel, ipcMain)
}
