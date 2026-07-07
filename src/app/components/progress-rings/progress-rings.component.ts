import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/** Apple Watch-style dual activity rings: outer = calories, inner = protein. */
@Component({
  selector: 'app-progress-rings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.viewBox]="'0 0 ' + size + ' ' + size" class="rings">
      <circle class="ring-track" [attr.cx]="center" [attr.cy]="center" [attr.r]="outerRadius" [attr.stroke-width]="strokeWidth" />
      <circle
        class="ring-track ring-track-protein"
        [attr.cx]="center"
        [attr.cy]="center"
        [attr.r]="innerRadius"
        [attr.stroke-width]="strokeWidth"
      />

      <circle
        class="ring-fill"
        [class.ring-over]="caloriesOver"
        [attr.cx]="center"
        [attr.cy]="center"
        [attr.r]="outerRadius"
        [attr.stroke-width]="strokeWidth"
        [attr.stroke-dasharray]="outerCircumference"
        [attr.stroke-dashoffset]="outerOffset"
        [attr.transform]="'rotate(-90 ' + center + ' ' + center + ')'"
      />
      <circle
        class="ring-fill ring-fill-protein"
        [attr.cx]="center"
        [attr.cy]="center"
        [attr.r]="innerRadius"
        [attr.stroke-width]="strokeWidth"
        [attr.stroke-dasharray]="innerCircumference"
        [attr.stroke-dashoffset]="innerOffset"
        [attr.transform]="'rotate(-90 ' + center + ' ' + center + ')'"
      />
    </svg>
  `,
})
export class ProgressRingsComponent {
  @Input() caloriePercent = 0;
  @Input() proteinPercent = 0;
  @Input() caloriesOver = false;

  readonly size = 168;
  readonly strokeWidth = 16;
  private readonly ringGap = 6;

  get center(): number {
    return this.size / 2;
  }

  get outerRadius(): number {
    return this.center - this.strokeWidth / 2 - 2;
  }

  get innerRadius(): number {
    return this.outerRadius - this.strokeWidth - this.ringGap;
  }

  get outerCircumference(): number {
    return 2 * Math.PI * this.outerRadius;
  }

  get innerCircumference(): number {
    return 2 * Math.PI * this.innerRadius;
  }

  get outerOffset(): number {
    return this.outerCircumference * (1 - this.clamp(this.caloriePercent));
  }

  get innerOffset(): number {
    return this.innerCircumference * (1 - this.clamp(this.proteinPercent));
  }

  private clamp(percent: number): number {
    return Math.min(1, Math.max(0, percent / 100));
  }
}
