import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '../../models';
import { GithubTokenService } from '../../services/github-token.service';
import { ProfilesService } from '../../services/profiles.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Settings</h2>

    <div class="card">
      <h3>GitHub sync</h3>
      <p class="muted" *ngIf="sync.status$ | async as status">
        Status: <strong [style.color]="'var(--text)'">{{ status.state }}</strong>
        <span *ngIf="status.lastSyncedAt"> · last synced {{ status.lastSyncedAt | date: 'medium' }}</span>
        <br *ngIf="status.error" />
        <span *ngIf="status.error">{{ status.error }}</span>
      </p>

      <ng-container *ngIf="!hasToken">
        <input
          type="password"
          class="search-input"
          placeholder="GitHub personal access token (repo contents read/write)"
          [(ngModel)]="tokenInput"
        />
        <button class="btn btn-primary btn-small" (click)="connect()">Connect</button>
      </ng-container>
      <div class="btn-row" *ngIf="hasToken">
        <button class="btn btn-small" (click)="sync.retryNow()">Sync now</button>
        <button class="btn btn-small btn-danger" (click)="disconnect()">Disconnect</button>
      </div>
    </div>

    <div class="card">
      <h3>Profiles</h3>
      <div class="entry-list">
        <div class="entry-row" *ngFor="let profile of profiles">
          <div class="entry-info" style="flex: 1; min-width: 200px">
            <div class="btn-row" style="margin-bottom: 8px">
              <input
                class="search-input"
                style="margin-bottom: 0; flex: 1"
                [(ngModel)]="profile.name"
                (change)="saveRename(profile)"
              />
              <span class="field"
                ><input [(ngModel)]="profile.emoji" (change)="saveRename(profile)" size="3"
              /></span>
            </div>
            <div class="btn-row">
              <span class="field">cal <input type="number" [(ngModel)]="profile.dailyCalorieGoal" (change)="saveGoals(profile)" /></span>
              <span class="field"
                >protein <input type="number" [(ngModel)]="profile.dailyProteinGoal" (change)="saveGoals(profile)"
              /></span>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-small" (click)="switchTo(profile)" [disabled]="profile.id === activeProfileId">
              {{ profile.id === activeProfileId ? 'Active' : 'Switch' }}
            </button>
            <button class="btn btn-small btn-danger" (click)="remove(profile)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Create profile</h3>
      <div class="inline-form">
        <input class="search-input" style="margin-bottom: 0" placeholder="Name" [(ngModel)]="newName" />
        <div class="btn-row">
          <span class="field">emoji <input [(ngModel)]="newEmoji" size="3" /></span>
          <span class="field">cal goal <input type="number" [(ngModel)]="newCalorieGoal" /></span>
          <span class="field">protein goal <input type="number" [(ngModel)]="newProteinGoal" /></span>
        </div>
        <button class="btn btn-primary btn-small" (click)="create()">Add profile</button>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  profiles: Profile[] = [];
  activeProfileId: string | null = null;

  newName = '';
  newEmoji = '🙂';
  newCalorieGoal = 2000;
  newProteinGoal = 120;

  hasToken = false;
  tokenInput = '';

  constructor(
    private profilesService: ProfilesService,
    private tokenService: GithubTokenService,
    public sync: SyncService
  ) {}

  ngOnInit(): void {
    this.refresh();
    this.hasToken = this.tokenService.hasToken();
  }

  async connect(): Promise<void> {
    if (!this.tokenInput.trim()) {
      return;
    }
    await this.sync.connect(this.tokenInput);
    this.tokenInput = '';
    this.hasToken = this.tokenService.hasToken();
    this.refresh();
  }

  disconnect(): void {
    this.sync.disconnect();
    this.hasToken = false;
  }

  create(): void {
    if (!this.newName.trim()) {
      return;
    }
    this.profilesService.create({
      name: this.newName.trim(),
      emoji: this.newEmoji.trim() || '🙂',
      dailyCalorieGoal: this.newCalorieGoal,
      dailyProteinGoal: this.newProteinGoal,
    });
    this.newName = '';
    this.newEmoji = '🙂';
    this.newCalorieGoal = 2000;
    this.newProteinGoal = 120;
    this.refresh();
  }

  saveRename(profile: Profile): void {
    this.profilesService.update(profile.id, { name: profile.name, emoji: profile.emoji });
    this.refresh();
  }

  saveGoals(profile: Profile): void {
    this.profilesService.update(profile.id, {
      dailyCalorieGoal: profile.dailyCalorieGoal,
      dailyProteinGoal: profile.dailyProteinGoal,
    });
    this.refresh();
  }

  switchTo(profile: Profile): void {
    this.profilesService.setActiveProfileId(profile.id);
    this.refresh();
  }

  remove(profile: Profile): void {
    this.profilesService.delete(profile.id);
    this.refresh();
  }

  private refresh(): void {
    this.profiles = this.profilesService.getAll();
    this.activeProfileId = this.profilesService.getActiveProfileId();
  }
}
