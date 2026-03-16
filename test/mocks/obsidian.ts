export class Plugin {
  app: App
  manifest: any
  loadData() { return Promise.resolve({}) }
  saveData(_data: any) { return Promise.resolve() }
  addCommand(_cmd: any) {}
  addSettingTab(_tab: any) {}
  addStatusBarItem() { return document.createElement('div') }
  registerView(_type: string, _viewCreator: any) {}
  registerEvent(_ref: any) {}
  registerInterval(_id: number) { return _id }
}
export class Modal {
  app: App
  contentEl: HTMLElement = document.createElement('div')
  modalEl: HTMLElement = document.createElement('div')
  constructor(_app: App) { this.app = _app }
  open() {}
  close() {}
  onOpen() {}
  onClose() {}
}
export class ItemView {
  app: App
  leaf: any
  containerEl: HTMLElement = document.createElement('div')
  navigation = false
  constructor(leaf: any) {
    this.leaf = leaf
    this.app = leaf?.app ?? {}
    this.containerEl.append(document.createElement('div'))
    this.containerEl.append(document.createElement('div'))
  }
}
export class PluginSettingTab {
  app: App
  plugin: any
  containerEl: HTMLElement = document.createElement('div')
  constructor(_app: App, _plugin: any) {
    this.app = _app
    this.plugin = _plugin
  }
  display() {}
}
export class Setting {
  constructor(_el: HTMLElement) {}
  setName(_name: string) { return this }
  setDesc(_desc: string) { return this }
  addText(_cb: any) { return this }
  addDropdown(_cb: any) { return this }
  addToggle(_cb: any) { return this }
}
export class Notice {
  constructor(_msg: string, _timeout?: number) {}
}
export class Menu {
  addItem(cb: (item: any) => any) { cb({ setTitle() { return this }, setIcon() { return this }, onClick() { return this } }); return this }
  addSeparator() { return this }
  showAtMouseEvent(_event: MouseEvent) {}
}
export class TAbstractFile {}
export class TFile extends TAbstractFile {
  path = ''
  basename = ''
  extension = 'md'
}
export class MarkdownView {
  editor = {
    getSelection: () => '',
  }
}
export class WorkspaceLeaf {
  app: any
  view: any
  async setViewState(_state: any) {}
}
export function setIcon(_el: HTMLElement, _icon: string) {}
export declare class App {}
export const Platform = { isDesktop: true, isMobile: false }
