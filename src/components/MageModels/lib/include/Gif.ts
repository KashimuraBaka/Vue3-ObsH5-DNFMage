import { GetAseetsBytes } from '@/utils/buffer';
import { Buffer } from 'buffer';

import type { GifFrame, GifValue } from './@Gif';

class Stream {
  public buff = Buffer.alloc(0);
  public index = 0;
  public length = 0;

  /** 读取字节 */
  get bytes() {
    return this.buff.readUIntBE(this.index++, 1);
  }

  public string(len: number) {
    return this.buff.toString('utf-8', this.index, this.index += len);
  }

  public set(bytes: ArrayBuffer) {
    this.index = 0;
    this.buff = Buffer.from(bytes);
    this.length = this.buff.byteLength;
  }

  public getSubBlock() {
    let size: number, count: number;
    const data = [];
    do {
      count = size = this.bytes;
      while (count--) {
        data.push(this.bytes);
      }
    } while (size !== 0 && this.index < this.length);
    return data;
  }

  public release() {
    this.index = 0;
    this.buff = Buffer.alloc(0);
    this.length = 0;
  }
}

export default class GifHandle {
  private streams = new Stream();
  private timerID?: number;
  private pixelBufSize!: number;
  private pixelBuf?: Uint8Array;
  private deinterlaceBuf?: Uint8Array;
  private interlacedBufSize!: number;
  private interlaceOffsets = [0, 4, 2, 1];
  private interlaceSteps = [8, 8, 4, 2];
  private GIF_FILE = {
    GCExt: 0xF9,
    COMMENT: 0xFE,
    APPExt: 0xFF,
    UNKNOWN: 0x01,
    IMAGE: 0x2C,
    EOF: 59,
    EXT: 0x21,
  }
  public val: GifValue = {
    paused: false,
    playing: false,
    waitTillDone: true,
    loading: false,
    firstFrameOnly: false,
    width: 0,
    height: 0,
    frames: [],
    comment: "",
    length: 0,
    currentFrame: 0,
    frameCount: 0,
    playSpeed: 1,
    playOnLoad: true,
  }

  public onload?: (e: { type: string, path: GifValue[] }) => void;
  public onerror?: (e: { type: string, path: GifHandle[] }) => void;
  public onprogress?: (e: { bytesRead: number, totalBytes: number, frame: number }) => void;
  public onloadall?: (e: { type: string, path: GifValue[] }) => void;

  constructor(filename: string) {
    this.val.src = filename;
    this.val.loading = true;
    this.loadImage(filename);
  }

  // 加载图像
  private async loadImage(filename: string) {
    const bytes = await GetAseetsBytes(filename);
    if (bytes.byteLength) {
      this.dataLoaded(bytes);
    } else {
      this.error("File not found");
    }
  }

  public replay(frame = 0) {
    this.seekFrame(frame);
    this.play();
  }

  public play() {
    this.pause();
    if (!this.val.playing) {
      this.val.paused = false;
      this.val.playing = true;
      this.playing();
    }
  }

  public pause() {
    this.val.paused = true;
    this.val.playing = false;
    clearTimeout(this.timerID);
  }

  public seek(time: number) {
    clearTimeout(this.timerID);
    if (time < 0) {
      time = 0
    }
    time *= 1000; // in ms
    time %= this.val.length;
    let frame = 0;
    while (time > this.val.frames[frame].time + this.val.frames[frame].delay && frame < this.val.frames.length) {
      frame += 1
    }
    this.val.currentFrame = frame;
    if (this.val.playing) {
      this.playing()
    } else {
      this.val.image = this.val.frames[this.val.currentFrame].image
    }
  }

  // 跳转指定帧数
  public seekFrame(frame: number) {
    clearTimeout(this.timerID);
    this.val.currentFrame = frame % this.val.frames.length;
    if (this.val.playing) {
      this.playing()
    } else {
      this.val.image = this.val.frames[this.val.currentFrame].image
    }
  }

  private playing() {
    let delay, frame;
    if (this.val.playSpeed === 0) {
      this.pause();
      return;
    } else if (!this.val.paused) {
      if (this.val.playSpeed < 0) {
        this.val.currentFrame -= 1;
        if (this.val.currentFrame < 0) {
          this.val.currentFrame = this.val.frames.length - 1
        }
        frame = this.val.currentFrame;
        frame -= 1;
        if (frame < 0) { frame = this.val.frames.length - 1 }
        delay = -this.val.frames[frame].delay * 1 / this.val.playSpeed;
      } else {
        this.val.currentFrame += 1;
        this.val.currentFrame %= this.val.frames.length; // 如果当前帧超过最大帧自动返回第1帧
        delay = this.val.frames[this.val.currentFrame].delay * 1 / this.val.playSpeed;
      }
      this.val.image = this.val.frames[this.val.currentFrame].image;
      this.timerID = setTimeout(() => { this.playing(); }, delay);
    }
  }

  private error(type: string) {
    if (typeof this.onerror === "function") {
      (this.onerror.bind(this))({
        type: type,
        path: [this]
      })
    }
    this.onload = this.onerror = undefined;
    this.val.loading = false;
  }

  private dataLoaded(data: ArrayBuffer) {
    // 读取字节流
    this.streams.set(data);
    this.parse();
  }

  private parse() {
    // 跳过文件头
    this.streams.index = 6;
    this.val.width = this.streams.bytes + (this.streams.bytes << 8);
    this.val.height = (this.streams.bytes) + (this.streams.bytes << 8);
    const bitField = this.streams.bytes;
    this.val.colorRes = (bitField & 0b1110000) >> 4;
    this.val.globalColourCount = 1 << ((bitField & 0b111) + 1);
    this.val.bgColourIndex = this.streams.bytes;
    this.streams.index++;
    if (bitField & 0b10000000) {
      this.val.globalColourTable = this.parseColourTable(this.val.globalColourCount)
    }
    (async () => { this.parseBlock() })();
  }

  /** 获取颜色 */
  private parseColourTable(count: number) {
    const colours = [];
    for (let i = 0; i < count; i++) {
      colours.push([
        this.streams.bytes,
        this.streams.bytes,
        this.streams.bytes
      ])
    }
    return colours;
  }

  private parseBlock() {
    const blockId = this.streams.bytes;
    if (blockId === this.GIF_FILE.IMAGE) {
      this.parseImg();
      if (this.val.firstFrameOnly) {
        this.finnished();
        return
      }
    } else if (blockId === this.GIF_FILE.EOF) {
      this.finnished();
      return
    } else {
      this.parseExt()
    }
    if (typeof this.onprogress === "function") {
      this.onprogress({
        bytesRead: this.streams.index,
        totalBytes: this.streams.buff.byteLength,
        frame: this.val.frames.length
      });
    }
    (async () => { this.parseBlock() })()
  }

  private finnished() {
    this.streams.release();
    this.val.loading = false;
    this.val.frameCount = this.val.frames.length;
    this.val.lastFrame = undefined;
    this.val.complete = true;
    this.val.disposalMethod = undefined;
    this.val.transparencyGiven = undefined;
    this.val.delayTime = undefined;
    this.val.transparencyIndex = undefined;
    this.val.waitTillDone = false;
    this.pixelBuf = undefined;
    this.deinterlaceBuf = undefined;
    this.pixelBufSize = 0;
    this.val.currentFrame = 0;
    if (this.val.frames.length > 0) {
      this.val.image = this.val.frames[0].image
    }
    this.doOnloadEvent();
    if (typeof this.onloadall === "function") {
      (this.onloadall.bind(this.val))({
        type: 'loadall',
        path: [this.val]
      });
    }
    if (this.val.playOnLoad) {
      this.play()
    }
  }

  private parseImg() {
    const deinterlace = (width: number) => {
      let fromLine, pass;
      const lines = this.pixelBufSize / width;
      fromLine = 0;
      if (this.interlacedBufSize !== this.pixelBufSize) {
        this.deinterlaceBuf = new Uint8Array(this.pixelBufSize);
        this.interlacedBufSize = this.pixelBufSize;
      }
      for (pass = 0; pass < 4; pass++) {
        for (let toLine = this.interlaceOffsets[pass]; toLine < lines; toLine += this.interlaceSteps[pass]) {
          this.deinterlaceBuf!.set(this.pixelBuf!.subarray(fromLine, fromLine + width), toLine * width);
          fromLine += width;
        }
      }
    };
    const time = this.val.length;
    const delay = this.val.delayTime! * 10;
    this.val.length += delay;
    let transparencyIndex: number | undefined;
    if (this.val.transparencyGiven) {
      transparencyIndex = this.val.transparencyIndex;
    } else {
      transparencyIndex = undefined;
    }
    const leftPos = this.streams.bytes + (this.streams.bytes << 8);
    const topPos = this.streams.bytes + (this.streams.bytes << 8);
    const width = this.streams.bytes + (this.streams.bytes << 8);
    const height = this.streams.bytes + (this.streams.bytes << 8);
    const bitField = this.streams.bytes;
    const localColourTableFlag = bitField & 0b10000000 ? true : false;
    let localColourTable = undefined;
    if (localColourTableFlag) {
      localColourTable = this.parseColourTable(1 << ((bitField & 0b111) + 1))
    }
    if (this.pixelBufSize !== width * height) {
      this.pixelBuf = new Uint8Array(width * height);
      this.pixelBufSize = width * height;
    }
    this.lzwDecode(this.streams.bytes, this.streams.getSubBlock());
    let interlaced = false;
    if (bitField & 0b1000000) {
      interlaced = true;
      deinterlace(width);
    }
    const frame: GifFrame = {
      disposalMethod: this.val.disposalMethod!,
      time,
      delay,
      transparencyIndex,
      leftPos,
      topPos,
      width,
      height,
      localColourTable,
      localColourTableFlag,
      interlaced
    }
    this.val.frames.push(frame);
    this.processFrame(frame);
  }

  private parseExt() {
    const blockID = this.streams.bytes;
    if (blockID === this.GIF_FILE.GCExt) {
      this.parseGCExt();
    } else if (blockID === this.GIF_FILE.COMMENT) {
      this.val.comment += this.streams.getSubBlock();
    } else if (blockID === this.GIF_FILE.APPExt) {
      this.parseAppExt();
    } else {
      if (blockID === this.GIF_FILE.UNKNOWN) {
        this.streams.index += 13;
      }
      this.streams.getSubBlock();
    }
  }

  private parseGCExt() {
    this.streams.index++;
    const bitField = this.streams.bytes;
    this.val.disposalMethod = (bitField & 0b11100) >> 2;
    this.val.transparencyGiven = bitField & 0b1 ? true : false;
    this.val.delayTime = this.streams.bytes + (this.streams.bytes << 8);
    this.val.transparencyIndex = this.streams.bytes;
    this.streams.index++;
  }

  private parseAppExt() {
    this.streams.index++;
    if ('NETSCAPE' === this.streams.string(8)) {
      this.streams.index += 8
    } else {
      this.streams.index += 3;
      this.streams.getSubBlock();
    }
  }

  private doOnloadEvent() {
    this.val.currentFrame = 0;
    this.val.nextFrameAt = this.val.lastFrameAt = new Date().valueOf();
    if (typeof this.onload === "function") {
      (this.onload.bind(this.val))({
        type: 'load',
        path: [this.val]
      })
    }
    this.onerror = this.onload = undefined;
  }

  private lzwDecode(minSize: number, data: number[]) {
    let i = 0
    const clear = 1 << minSize;
    const eod = clear + 1;
    let size = minSize + 1;
    let done = false;
    let code = 0;
    let last = 0;
    let d = [];
    let len = 0;
    let pos = 0;
    let pixelPos = 0;
    let dic: Array<number[] | null> = [];
    while (!done) {
      last = code;
      code = 0;
      for (i = 0; i < size; i++) {
        if (data[pos >> 3] & (1 << (pos & 7))) {
          code |= 1 << i
        }
        pos++;
      }
      if (code === clear) {
        dic = [];
        size = minSize + 1;
        for (i = 0; i < clear; i++) {
          dic[i] = [i]
        }
        dic[clear] = [];
        dic[eod] = null;
      } else {
        if (code === eod) {
          done = true;
          return
        }
        if (code >= dic.length) {
          dic.push(dic[last]!.concat(dic[last]![0]))
        } else if (last !== clear) {
          dic.push(dic[last]!.concat(dic[code]![0]))
        }
        d = dic[code]!;
        len = d.length;
        for (i = 0; i < len; i++) {
          this.pixelBuf![pixelPos++] = d[i]
        }
        if (dic.length === (1 << size) && size < 12) {
          size++
        }
      }
    }
  }

  private processFrame(frame: GifFrame) {
    let ind, i, pixel, pDat, col;
    frame.image = new OffscreenCanvas(this.val.height, this.val.width);
    frame.image.width = this.val.width;
    frame.image.height = this.val.height;
    frame.ctx = frame.image.getContext("2d") as OffscreenCanvasRenderingContext2D;
    const ct = frame.localColourTableFlag ? frame.localColourTable : this.val.globalColourTable;
    if (!this.val.lastFrame) {
      this.val.lastFrame = frame
    }
    const useT = (this.val.lastFrame!.disposalMethod === 2 || this.val.lastFrame!.disposalMethod === 3) ? true : false;
    if (!useT) {
      frame.ctx!.drawImage(this.val.lastFrame!.image!, 0, 0, this.val.width, this.val.height)
    }
    const cData = frame.ctx.getImageData(frame.leftPos, frame.topPos, frame.width, frame.height);
    const ti = frame.transparencyIndex;
    const dat = cData.data;
    if (frame.interlaced) {
      pDat = this.deinterlaceBuf!;
    } else {
      pDat = this.pixelBuf!;
    }
    const pixCount = pDat.length;
    ind = 0;
    for (i = 0; i < pixCount; i++) {
      pixel = pDat[i];
      col = ct![pixel];
      if (ti !== pixel) {
        dat[ind++] = col[0];
        dat[ind++] = col[1];
        dat[ind++] = col[2];
        dat[ind++] = 255;
      } else {
        if (useT) {
          dat[ind + 3] = 0;
          ind += 4;
        } else {
          ind += 4
        }
      }
    }
    frame.ctx.putImageData(cData, frame.leftPos, frame.topPos);
    this.val.lastFrame = frame;
    if (!this.val.waitTillDone && typeof this.onload === "function") {
      this.doOnloadEvent()
    }
  }
}
