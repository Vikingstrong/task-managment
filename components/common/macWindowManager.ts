export interface DockWindow {
  id: string
  title: string
  restore: () => void
  close: () => void
}

type Listener = () => void

class MacWindowManager {
  private minimizedWindows: DockWindow[] = []
  private activeModalId: string | null = null
  private listeners: Set<Listener> = new Set()

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l()
      } catch (err) {
        console.error("Error in dock window listener", err)
      }
    })
  }

  getMinimizedWindows = (): DockWindow[] => {
    return this.minimizedWindows
  }

  getActiveModalId = (): string | null => {
    return this.activeModalId
  }

  setActiveModal(id: string | null) {
    this.activeModalId = id
    if (id) {
      // If this modal was in the dock tray, remove it since it is now active on screen
      this.minimizedWindows = this.minimizedWindows.filter((w) => w.id !== id)
    }
    this.notify()
  }

  minimizeWindow(window: DockWindow) {
    // Rule: Exactly 1 window can be in the minimized dock tray!
    // If another window was already in the dock, it is closed and completely erased.
    while (this.minimizedWindows.length > 0) {
      const prev = this.minimizedWindows.shift()
      if (prev && prev.id !== window.id) {
        prev.close()
      }
    }
    this.minimizedWindows.push(window)

    if (this.activeModalId === window.id) {
      this.activeModalId = null
    }

    this.notify()
  }

  restoreWindow(id: string) {
    const win = this.minimizedWindows.find((w) => w.id === id)
    if (win) {
      this.minimizedWindows = this.minimizedWindows.filter((w) => w.id !== id)
      this.activeModalId = id
      win.restore()
      this.notify()
    }
  }

  closeWindow(id: string) {
    const win = this.minimizedWindows.find((w) => w.id === id)
    if (win) {
      this.minimizedWindows = this.minimizedWindows.filter((w) => w.id !== id)
      if (this.activeModalId === id) {
        this.activeModalId = null
      }
      win.close()
      this.notify()
    }
  }

  unregister(id: string) {
    const prevLen = this.minimizedWindows.length
    this.minimizedWindows = this.minimizedWindows.filter((w) => w.id !== id)
    if (this.activeModalId === id) {
      this.activeModalId = null
    }
    if (this.minimizedWindows.length !== prevLen) {
      this.notify()
    }
  }
}

export const macWindowManager = new MacWindowManager()
