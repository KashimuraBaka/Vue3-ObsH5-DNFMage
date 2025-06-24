export default class webp {
  public image?: CanvasImageSource;
  public height = 0;
  public width = 0;

  constructor(fileurl: string) {
    this.load(fileurl);
  }

  private async load(url: string) {
    const imgblob = await fetch(url).then(r => r.blob());
    this.image = await createImageBitmap(imgblob);
    this.height = this.image.height;
    this.width = this.image.width;
  }
}
