declare module 'serialport' {
  export class SerialPort {
    constructor(path: { baudRate: number; path: string }, options?: any);
    static list(): Promise<
      Array<{
        vendorId: string;
        productId: string;
        locationId: string;
        pnpId: string;
        serialNumber: string;
        manufacturer: string;
        path: string;
      }>
    >;
    open(callback?: () => void): void;

    close(callback?: (err) => void): void;

    write(eucKRBuffer: Buffer, param2: (err) => void) {}
  }
}
