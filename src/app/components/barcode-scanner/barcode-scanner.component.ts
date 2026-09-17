import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

/** Full-screen camera overlay that decodes a product barcode via the device camera. */
@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay">
      <div class="scanner-box">
        <div class="meal-editor-header">
          <h3>Scan barcode</h3>
          <button type="button" class="icon-btn" title="Cancel" (click)="cancelled.emit()">✕</button>
        </div>
        <video #video class="scanner-video" muted playsinline></video>
        <p class="muted" *ngIf="error">{{ error }}</p>
        <p class="muted" *ngIf="!error">Point your camera at the product's barcode.</p>
      </div>
    </div>
  `,
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @Output() scanned = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  error: string | null = null;

  private readonly reader = new BrowserMultiFormatReader();
  private controls: IScannerControls | null = null;
  private done = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      this.controls = await this.reader.decodeFromVideoDevice(undefined, this.videoRef.nativeElement, (result) => {
        if (result && !this.done) {
          this.done = true;
          this.scanned.emit(result.getText());
        }
      });
    } catch (error) {
      console.error('Failed to start the camera', error);
      this.error = 'Could not access the camera. Check camera permissions and try again.';
    }
  }

  ngOnDestroy(): void {
    this.controls?.stop();
  }
}
