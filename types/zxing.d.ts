declare module '@zxing/browser' {
  export class BrowserQRCodeReader {
    constructor();
    static listVideoInputDevices(): Promise<MediaDeviceInfo[]>;
    decodeFromVideoDevice(
      deviceId: string | undefined,
      videoElement: HTMLVideoElement,
      callbackFn: (result: Result | undefined) => void
    ): Promise<void>;
    reset(): Promise<void>;
    isScanning: boolean;
  }
}

interface Result {
  getText(): string;
}