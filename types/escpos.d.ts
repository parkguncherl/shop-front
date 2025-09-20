declare module 'escpos' {
  export class Printer {
    constructor(device: any);
    image(image: Buffer | any, type?: string): this;
    cut(): this;
    close(): void;
  }
}
