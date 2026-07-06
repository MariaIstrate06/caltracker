import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <nav>
      <a routerLink="/home">Home</a> | <a routerLink="/today">Today</a> |
      <a routerLink="/browse">Browse</a> | <a routerLink="/drinks">Drinks</a> |
      <a routerLink="/stats">Stats</a> | <a routerLink="/settings">Settings</a>
    </nav>
    <router-outlet />
  `,
})
export class AppComponent {}
