import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Drink, Profile, Snack, Theme } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DrinksService } from '../../services/drinks.service';
import { ProfilesService } from '../../services/profiles.service';
import { SnacksService } from '../../services/snacks.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Settings</h2>

    <div class="card" *ngIf="profile as p">
      <h3>Display name</h3>
      <div class="btn-row">
        <input class="search-input" style="margin-bottom: 0; flex: 1" placeholder="Name" [(ngModel)]="p.name" (change)="saveDisplayName()" />
        <span class="field"><input [(ngModel)]="p.emoji" (change)="saveDisplayName()" size="3" /></span>
      </div>
    </div>

    <div class="card" *ngIf="profile as p">
      <h3>My goals</h3>
      <div class="btn-row">
        <span class="field">cal goal <input type="number" [(ngModel)]="p.dailyCalorieGoal" /></span>
        <span class="field">protein goal <input type="number" [(ngModel)]="p.dailyProteinGoal" /></span>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary btn-small" (click)="saveGoals()">Save</button>
        <span class="muted" *ngIf="goalsSaved">Saved ✓</span>
      </div>
    </div>

    <div class="card" *ngIf="profile as p">
      <h3>Theme</h3>
      <div class="btn-row">
        <button class="btn btn-small" [class.btn-primary]="p.theme === 'green'" (click)="setTheme('green')">Green</button>
        <button class="btn btn-small" [class.btn-primary]="p.theme === 'pink'" (click)="setTheme('pink')">Pink</button>
      </div>
    </div>

    <div class="card" *ngIf="profile as p">
      <h3>Home screen — available items</h3>
      <p class="muted">Pick which drinks and snacks show on Home's "Drinks & snacks available" card, then save.</p>

      <h4>Drinks</h4>
      <div class="checkbox-list">
        <label class="checkbox-row" *ngFor="let drink of drinks">
          <input type="checkbox" [checked]="isFeaturedDrink(drink.id)" (change)="toggleFeaturedDrink(drink.id)" />
          {{ drink.name }}
        </label>
        <p class="muted" *ngIf="!drinks.length">No drinks in the library yet.</p>
      </div>

      <h4>Snacks</h4>
      <div class="checkbox-list">
        <label class="checkbox-row" *ngFor="let snack of snacks">
          <input type="checkbox" [checked]="isFeaturedSnack(snack.id)" (change)="toggleFeaturedSnack(snack.id)" />
          {{ snack.name }}
        </label>
        <p class="muted" *ngIf="!snacks.length">No snacks in the library yet.</p>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary btn-small" (click)="saveFeatured()">Save</button>
        <span class="muted" *ngIf="featuredSaved">Saved ✓</span>
      </div>
    </div>

    <div class="card">
      <h3>Account</h3>
      <p class="muted">{{ email }}</p>
      <button class="btn btn-small btn-danger" (click)="logout()">Log out</button>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  profile: Profile | null = null;
  email = '';
  drinks: Drink[] = [];
  snacks: Snack[] = [];
  goalsSaved = false;
  featuredSaved = false;

  constructor(
    private profilesService: ProfilesService,
    private auth: AuthService,
    private themeService: ThemeService,
    private drinksService: DrinksService,
    private snacksService: SnacksService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    this.email = this.auth.currentUser()?.email ?? '';
    [this.profile, this.drinks, this.snacks] = await Promise.all([
      this.profilesService.getMine(),
      this.drinksService.getAll(),
      this.snacksService.getAll(),
    ]);
    this.cdr.detectChanges();
  }

  async saveDisplayName(): Promise<void> {
    if (!this.profile) {
      return;
    }
    await this.profilesService.updateMine({ name: this.profile.name, emoji: this.profile.emoji });
  }

  async saveGoals(): Promise<void> {
    if (!this.profile) {
      return;
    }
    await this.profilesService.updateMine({
      dailyCalorieGoal: this.profile.dailyCalorieGoal,
      dailyProteinGoal: this.profile.dailyProteinGoal,
    });
    this.flashSaved('goalsSaved');
  }

  async setTheme(theme: Theme): Promise<void> {
    if (!this.profile) {
      return;
    }
    this.profile.theme = theme;
    this.themeService.apply(theme);
    await this.profilesService.updateMine({ theme });
  }

  isFeaturedDrink(id: string): boolean {
    return this.profile?.featuredDrinkIds.includes(id) ?? false;
  }

  isFeaturedSnack(id: string): boolean {
    return this.profile?.featuredSnackIds.includes(id) ?? false;
  }

  /** Toggles are local-only until "Save" is clicked, so the DB write and its confirmation happen once, on demand. */
  toggleFeaturedDrink(id: string): void {
    if (!this.profile) {
      return;
    }
    const set = new Set(this.profile.featuredDrinkIds);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.profile.featuredDrinkIds = [...set];
  }

  toggleFeaturedSnack(id: string): void {
    if (!this.profile) {
      return;
    }
    const set = new Set(this.profile.featuredSnackIds);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.profile.featuredSnackIds = [...set];
  }

  async saveFeatured(): Promise<void> {
    if (!this.profile) {
      return;
    }
    await this.profilesService.updateMine({
      featuredDrinkIds: this.profile.featuredDrinkIds,
      featuredSnackIds: this.profile.featuredSnackIds,
    });
    this.flashSaved('featuredSaved');
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigateByUrl('/login');
  }

  private flashSaved(flag: 'goalsSaved' | 'featuredSaved'): void {
    this[flag] = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this[flag] = false;
      this.cdr.detectChanges();
    }, 1800);
  }
}
