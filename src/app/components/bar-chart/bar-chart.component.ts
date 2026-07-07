import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface ChartBar {
  value: number;
  color: string;
  label: string;
}

/**
 * Minimal SVG bar chart — no external charting dependency. Each bar carries its own color, so
 * this doubles as a per-day status chart (e.g. over/under goal) and a plain single-hue trend.
 * Mark spec: bars capped at 24px thick, 4px rounded top / square baseline, 2px gap between bars,
 * a hairline goal reference line. A native <title> gives a free hover tooltip.
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none" class="bar-chart">
      <line
        *ngIf="goalLine !== undefined"
        [attr.x1]="0"
        [attr.x2]="width"
        [attr.y1]="goalY"
        [attr.y2]="goalY"
        class="chart-goal-line"
      />
      <path
        *ngFor="let bar of bars; let i = index"
        [attr.d]="barPath(i, bar.value)"
        [attr.fill]="bar.color"
      >
        <title>{{ bar.label }}: {{ bar.value | number: '1.0-0' }}</title>
      </path>
    </svg>
  `,
})
export class BarChartComponent {
  @Input() bars: ChartBar[] = [];
  @Input() goalLine?: number;

  readonly width = 300;
  readonly height = 110;
  readonly gap = 2;
  /** Reserves headroom so a bar at (or a goal line at) the max value never touches the top edge. */
  private readonly topPadding = 10;
  private readonly maxBarThickness = 24;

  get slotWidth(): number {
    return this.bars.length ? this.width / this.bars.length : this.width;
  }

  /** Bars never fill the whole slot — capped thickness, centered, so the gap reads as air, not a border. */
  get barWidth(): number {
    return Math.max(0, Math.min(this.slotWidth - this.gap, this.maxBarThickness));
  }

  get maxValue(): number {
    return Math.max(1, this.goalLine ?? 0, ...this.bars.map((bar) => bar.value));
  }

  get goalY(): number {
    return this.goalLine === undefined ? 0 : this.height - (this.goalLine / this.maxValue) * this.plotHeight;
  }

  private get plotHeight(): number {
    return this.height - this.topPadding;
  }

  barHeight(value: number): number {
    return (value / this.maxValue) * this.plotHeight;
  }

  /** Rounded top corners, square baseline — never a plain rect, per the mark spec. */
  barPath(index: number, value: number): string {
    const x = index * this.slotWidth + (this.slotWidth - this.barWidth) / 2;
    const barHeight = this.barHeight(value);
    const y = this.height - barHeight;
    const w = this.barWidth;
    const r = Math.min(4, barHeight, w / 2);

    return [
      `M ${x} ${y + r}`,
      `Q ${x} ${y} ${x + r} ${y}`,
      `L ${x + w - r} ${y}`,
      `Q ${x + w} ${y} ${x + w} ${y + r}`,
      `L ${x + w} ${this.height}`,
      `L ${x} ${this.height}`,
      'Z',
    ].join(' ');
  }
}
