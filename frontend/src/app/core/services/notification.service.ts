import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  show(type: 'success' | 'error' | 'warning' | 'info', message: string, durationMs = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message };

    this.toastsSignal.update(toasts => [...toasts, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  success(message: string, durationMs = 4000) {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs = 5000) {
    this.show('error', message, durationMs);
  }

  warning(message: string, durationMs = 4000) {
    this.show('warning', message, durationMs);
  }

  info(message: string, durationMs = 4000) {
    this.show('info', message, durationMs);
  }

  dismiss(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}
