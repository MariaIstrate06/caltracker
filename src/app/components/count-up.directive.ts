import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

/**
 * Animates an element's text content from its previous numeric value to a new one.
 * Reserved for hero numbers (Home's headline stats, Stats' averages/streaks) — applying
 * this to every number on screen would be noisy rather than tasteful.
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('appCountUp') value = 0;
  @Input() countUpDecimals = 0;
  @Input() countUpDurationMs = 500;

  private frameId: number | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['value']) {
      return;
    }
    const from = changes['value'].isFirstChange() ? 0 : (changes['value'].previousValue ?? 0);
    this.animate(from, this.value);
  }

  ngOnDestroy(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  private animate(from: number, to: number): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
    const start = performance.now();
    const duration = this.countUpDurationMs;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      this.el.nativeElement.textContent = current.toFixed(this.countUpDecimals);
      this.frameId = progress < 1 ? requestAnimationFrame(step) : null;
    };
    this.frameId = requestAnimationFrame(step);
  }
}
