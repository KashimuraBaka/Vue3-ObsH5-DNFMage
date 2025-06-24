import type { DanmakuMessage, DanmakuResponse, GiftMessage } from "./types"

export class DanmakuClient {
  private ws_url: string;
  private ws?: WebSocket;

  public OnMessage?: (_: DanmakuResponse) => void;
  public OnReciveDanmu?: (_: DanmakuMessage) => void;
  public OnSendGift?: (_: GiftMessage) => void;

  constructor(host: string) {
    this.ws_url = host;
    this.Connect();
  }

  private Connect() {
    this.ws = new WebSocket(`ws://${this.ws_url}`);
    this.ws.onmessage = (e) => {
      const data = JSON.parse(e.data) as DanmakuResponse;
      console.log(data);
      this.OnMessage?.(data);
      switch (data.cmd) {
        case 'LIVE_OPEN_PLATFORM_DM':
          this.OnReciveDanmu?.(data.data as DanmakuMessage);
          break;
        case 'LIVE_OPEN_PLATFORM_SEND_GIFT':
          this.OnSendGift?.(data.data as GiftMessage);
          break;
      }
      if (data.cmd == "LIVE_OPEN_PLATFORM_DM") {
      }
    }
    this.ws.onclose = () => {
      setTimeout(this.Connect, 5000);
    }
  }
}
