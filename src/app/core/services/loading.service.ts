import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = signal(0);
  
  readonly isLoading = computed(() => this._loading() > 0);
  
  show(): void {
    this._loading.update(count => count + 1);
  }
  
  hide(): void {
    this._loading.update(count => Math.max(0, count - 1));
  }
}
