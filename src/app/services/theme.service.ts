import { Injectable } from '@angular/core';
import { Theme } from '../models';

/** Applies a theme by toggling a `data-theme` attribute on `<html>`, which styles.css keys its color variables off. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
