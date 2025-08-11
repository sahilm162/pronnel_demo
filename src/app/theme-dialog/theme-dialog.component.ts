import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-theme-dialog',
  templateUrl: './theme-dialog.component.html',
  styleUrls: ['./theme-dialog.component.css']
})
export class ThemeDialogComponent {
  @Output() close = new EventEmitter<void>();

  themes = [
  { name: 'light-default', label: 'Light Default', previewColor: '#ffffff' },
  { name: 'light-blue', label: 'Light Blue', previewColor: '#e6f0ff' },
  { name: 'light-green', label: 'Light Green', previewColor: '#eaffea' },
  { name: 'light-purple', label: 'Light Purple', previewColor: '#f5f0ff' },
  { name: 'light-sunset', label: 'Light Sunset', previewColor: '#fff7f0' },
  { name: 'light-mint', label: 'Light Mint', previewColor: '#e6fff5' },

  { name: 'dark-default', label: 'Dark Default', previewColor: '#121212' },
  { name: 'dark-blue', label: 'Dark Blue', previewColor: '#0a192f' },
  { name: 'dark-green', label: 'Dark Green', previewColor: '#10221b' },
  { name: 'dark-purple', label: 'Dark Purple', previewColor: '#1a1125' },
  { name: 'dark-woodland', label: 'Dark Woodland', previewColor: '#1e2d24' },
  { name: 'dark-galaxy', label: 'Dark Galaxy', previewColor: '#0d0f2b' },
];

applyTheme(themeName: string) {
  document.body.className = '';
  document.body.classList.add(themeName);
  localStorage.setItem('selectedTheme', themeName);
}
}
