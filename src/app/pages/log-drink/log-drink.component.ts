import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { QuickItemListComponent } from '../../components/quick-item-list/quick-item-list.component';
import { DrinksService } from '../../services/drinks.service';
import { SnacksService } from '../../services/snacks.service';

@Component({
  selector: 'app-log-drink',
  standalone: true,
  imports: [CommonModule, QuickItemListComponent],
  template: `
    <h2>Log a drink</h2>

    <h3>Drinks</h3>
    <app-quick-item-list [repo]="drinksService" logType="drink" />

    <h3>Snacks</h3>
    <app-quick-item-list [repo]="snacksService" logType="snack" />
  `,
})
export class LogDrinkComponent {
  constructor(
    public drinksService: DrinksService,
    public snacksService: SnacksService
  ) {}
}
