import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { BrowserMultiFormatReader } from '@zxing/browser';

/**
 * Full-screen camera overlay for reading a product barcode. Deliberately capture-based rather
 * than continuous auto-scan: the user aims the camera and taps Capture once the barcode looks
 * in focus, instead of waiting on a background decode loop that may never trigger depending on
 * lighting/focus/angle.
 */
@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay">
      <div class="scanner-box">
        <div class="meal-editor-header">
          <h3>Scan barcode</h3>
          <button type="button" class="icon-btn" title="Cancel" (click)="cancel()">✕</button>
        </div>

        <video #video class="scanner-video" muted playsinline></video>
        <canvas #canvas style="display: none"></canvas>

        <p class="login-error" *ngIf="error">{{ error }}</p>
        <p class="muted" *ngIf="!error && !decoding">Line up the barcode, then tap Capture once it's in focus.</p>
        <p class="muted" *ngIf="decoding">Reading…</p>

        <div class="btn-row">
          <button class="btn btn-primary" (click)="capture()" [disabled]="!cameraReady || decoding">📸 Capture</button>
          <button class="btn" (click)="cancel()">Cancel</button>
        </div>
      </div>
    </div>
  `,
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() scanned = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  error: string | null = null;
  cameraReady = false;
  decoding = false;

  private stream: MediaStream | null = null;
  private readonly reader = new BrowserMultiFormatReader();

  async ngAfterViewInit(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.cameraReady = true;
    } catch (error) {
      console.error('Failed to start the camera', error);
      this.error = 'Could not access the camera. Check camera permissions and try again.';
    }
  }

  async capture(): Promise<void> {
    if (!this.cameraReady || this.decoding) {
      return;
    }
    this.decoding = true;
    this.error = null;
    try {
      const video = this.videoRef.nativeElement;
      const canvas = this.canvasRef.nativeElement;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = await this.reader.decodeFromImageUrl(canvas.toDataURL('image/png'));
      this.scanned.emit(result.getText());
    } catch (error) {
      this.error = "Couldn't read a barcode in that shot — line it up and try again.";
    } finally {
      this.decoding = false;
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  ngOnDestroy(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
  }
}
