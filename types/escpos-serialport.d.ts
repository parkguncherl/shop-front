declare module 'escpos-serialport' {
  import { Readable } from 'stream';

  export default class EscposSerialPort extends Readable {
    constructor(path: string, options?: { baudRate?: number });
    open(callback: () => void): void;
  }
}
