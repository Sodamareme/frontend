declare module 'qr-scanner' {
  export default class QrScanner {
    constructor(
      video: HTMLVideoElement,
      onResult: (result: { data: string }) => void,
      options?: {
        highlightScanRegion?: boolean;
        highlightCodeOutline?: boolean;
        returnDetailedScanResult?: boolean;
        preferredCamera?: 'environment' | 'user';
        maxScansPerSecond?: number;
      }
    );
    static hasCamera(): Promise<boolean>;
    destroy(): void;
    start(): Promise<void>;
    stop(): void;
    setCamera(facingMode: string): Promise<void>;
    static FACING_MODES: { FRONT: string; BACK: string };
  }
}