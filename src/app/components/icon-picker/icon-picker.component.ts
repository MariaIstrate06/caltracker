import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DEFAULT_MEAL_ICON, MEAL_ICON_OPTIONS } from '../../utils/meal-icons.util';

/** A trigger button showing the current icon that expands into a grid to pick another. */
@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button type="button" class="icon-picker-trigger" (click)="open = !open">
      <span class="icon-picker-current">{{ value || defaultIcon }}</span>
      <span class="muted">{{ open ? 'Close' : 'Choose icon' }}</span>
    </button>
    <div class="icon-picker-grid" *ngIf="open">
      <button
        type="button"
        class="icon-picker-option"
        *ngFor="let icon of icons"
        [class.selected]="icon === value"
        (click)="select(icon)"
      >
        {{ icon }}
      </button>
    </div>
  `,
})
export class IconPickerComponent {
  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string>();

  readonly icons = MEAL_ICON_OPTIONS;
  readonly defaultIcon = DEFAULT_MEAL_ICON;
  open = false;

  select(icon: string): void {
    this.value = icon;
    this.valueChange.emit(icon);
    this.open = false;
  }
}
