import { Injectable, signal } from '@angular/core';

interface ConfirmRequest {
  message: string;
  resolve: (value: boolean) => void;
}

/** In-app replacement for `window.confirm` — testable, stylable, and non-blocking. Rendered once by ConfirmDialogComponent in the app shell. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _request = signal<ConfirmRequest | null>(null);
  readonly request = this._request.asReadonly();

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this._request.set({ message, resolve });
    });
  }

  respond(value: boolean): void {
    this._request()?.resolve(value);
    this._request.set(null);
  }
}
