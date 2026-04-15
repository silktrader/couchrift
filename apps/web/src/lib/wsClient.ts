type Listener<T> = (event: T) => void
type EventMap = Record<string, { type: string }>

export class WsClient<TMap extends EventMap> {
  private ws: WebSocket | null = null
  private listeners = new Map<keyof TMap, Set<Listener<any>>>()

  constructor(private url: string) {}

  connect() {
    this.ws = new WebSocket(this.url)
    this.ws.onmessage = ({ data }) => {
      const event = JSON.parse(data) as TMap[keyof TMap]
      this.dispatch(event)
    }
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }

  private dispatch(event: TMap[keyof TMap]) {
    const type = event.type as keyof TMap
    const handlers = this.listeners.get(type)
    if (!handlers) return
    for (const handler of handlers) handler(event)
  }

  on<K extends keyof TMap>(type: K, handler: Listener<TMap[K]>): () => void {
    let listeners = this.listeners.get(type) as Set<Listener<TMap[K]>> | undefined
    if (!listeners) this.listeners.set(type, (listeners = new Set()))
    listeners.add(handler)

    return () => {
      listeners.delete(handler)
    }
  }
}