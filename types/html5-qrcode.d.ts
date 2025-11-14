declare module 'html5-qrcode' {
  interface CameraDevice {
    id: string;
    label: string;
  }

  export class Html5Qrcode {
    pause(arg0: boolean) {
        throw new Error('Method not implemented.');
    }
    resume() {
        throw new Error('Method not implemented.');
    }
    clear() {
        throw new Error('Method not implemented.');
    }
    isScanning: any;
    constructor(elementId: string);
    
    static getCameras(): Promise<CameraDevice[]>;
    
    start(
      cameraIdOrConfig: string | { facingMode: string },
      options: {
        fps: number;
        qrbox: { width: number; height: number };
        aspectRatio?: number;
      },
      onScanSuccess: (decodedText: string, decodedResult?: any) => void,
      onScanError?: (error?: any) => void
    ): Promise<void>;
    
    stop(): Promise<void>;
  }
}