export interface GifValue {
    delayTime?: number
    paused: boolean
    playing: boolean
    waitTillDone: boolean
    loading: boolean
    firstFrameOnly: boolean
    width: number
    height: number
    frames: GifFrame[]
    comment: string
    length: number
    currentFrame: number
    frameCount: number
    playSpeed: number
    lastFrame?: GifFrame
    colorRes?: number
    globalColourCount?: number
    globalColourTable?: number[][]
    bgColourIndex?: number
    image?: OffscreenCanvas
    playOnLoad: boolean
    src?: string
    complete?: boolean
    nextFrameAt?: number
    lastFrameAt?: number
    disposalMethod?: number
    transparencyIndex?: number
    transparencyGiven?: boolean
}

export interface GifFrame {
    disposalMethod: number
    interlaced: boolean
    time: number
    delay: number
    topPos: number
    leftPos: number
    width: number
    height: number
    transparencyIndex?: number
    localColourTable?: number[][]
    localColourTableFlag?: boolean
    image?: OffscreenCanvas
    ctx?: OffscreenCanvasRenderingContext2D
}