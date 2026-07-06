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

    <section>
      <h3>GitHub sync</h3>
      <p *ngIf="sync.status$ | async as status">
        Status: <strong>{{ status.state }}</strong>
        <span *ngIf="status.lastSyncedAt"> — last synced {{ status.lastSyncedAt | date: 'medium' }}</span>
        <span *ngIf="status.error"> — {{ status.error }}</span>
        <button *ngIf="status.state === 'error'" (click)="sync.retryNow()">Retry</button>
      </p>

      <div *ngIf="!hasToken">
        <input
          type="password"
          placeholder="GitHub personal access token (repo contents read/write)"
          [(ngModel)]="tokenInput"
          size="50"
        />
        <button (click)="connect()">Connect</button>
      </div>
      <div *ngIf="hasToken">
        <button (click)="sync.retryNow()">Sync now</button>
        <button (click)="disconnect()">Disconnect</button>
      </div>
    </section>

    <section>
      <h3>Profiles</h3>
      <ul>
        <li *ngFor="let profile of profiles">
          <input [(ngModel)]="profile.name" (change)="saveRename(profile)" />
          <input [(ngModel)]="profile.emoji" (change)="saveRename(profile)" size="3" />
          cal goal:
          <input type="number" [(ngModel)]="profile.dailyCalorieGoal" (change)="saveGoals(profile)" />
          protein goal:
          <input type="number" [(ngModel)]="profile.dailyProteinGoal" (change)="saveGoals(profile)" />
          <button (click)="switchTo(profile)" [disabled]="profile.id === activeProfileId">
            {{ profile.id === activeProfileId ? 'Active' : 'Switch to' }}
          </button>
          <button (click)="remove(profile)">Delete</button>
        </li>
      </ul>
    </section>

    <section>
      <h3>Create profile</h3>
      <input placeholder="Name" [(ngModel)]="newName" />
      <input placeholder="Emoji" [(ngModel)]="newEmoji" size="3" />
      <input placeholder="Calorie goal" type="number" [(ngModel)]="newCalorieGoal" />
      <input placeholder="Protein goal" type="number" [(ngModel)]="newProteinGoal" />
      <button (click)="create()">Add profile</button>
    </section>
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
