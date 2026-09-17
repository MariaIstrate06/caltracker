import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

/** Mounted once in AppComponent; renders whenever ConfirmService has a pending request. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-overlay" *ngIf="confirmService.request() as req">
      <div class="confirm-box">
        <p>{{ req.message }}</p>
        <div class="btn-row">
          <button class="btn btn-small btn-danger" (click)="confirmService.respond(true)">Delete</button>
          <button class="btn btn-small" (click)="confirmService.respond(false)">Cancel</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(public confirmService: ConfirmService) {}
}
