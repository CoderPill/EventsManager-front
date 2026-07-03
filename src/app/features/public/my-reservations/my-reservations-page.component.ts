import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';

import { ReservationsApi } from '../../../core/services/api/reservations.api';
import { ToastService } from '../../../core/services/toast.service';
import { ReservationDto } from '../../../core/models/dto';
import { EnumLabelPipe } from '../../../core/pipes/enum-label.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';

@Component({
  selector: 'app-my-reservations-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EnumLabelPipe,
    DateFormatPipe
  ],
  templateUrl: './my-reservations-page.component.html',
  styleUrl: './my-reservations-page.component.scss'
})
export class MyReservationsPageComponent {
  private fb = inject(FormBuilder);
  private reservationsApi = inject(ReservationsApi);
  private toast = inject(ToastService);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  reservation = signal<ReservationDto | null>(null);
  cancelling = signal(false);

  searchForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.maxLength(20)]]
  });

  search(): void {
    if (this.searchForm.invalid) return;
    this.errorMsg.set(null);
    this.reservation.set(null);
    this.loading.set(true);
    const { email, code } = this.searchForm.value;
    this.reservationsApi.getByCode(email?.trim()!, code?.trim()!)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.reservation.set(data);
        },
        error: (err) => {
          this.errorMsg.set(err?.errors?.join('\n') || err?.message || 'No se pudo consultar la reserva');
        }
      });
  }

  cancel(r: ReservationDto): void {
    if (!r.reservationCode) return;
    this.toast.confirm(
      'Cancelar reserva',
      `¿Estás seguro de cancelar la reserva ${r.reservationCode}?`
    ).then(confirmed => {
      if (!confirmed) return;
      this.cancelling.set(true);
      this.reservationsApi.cancel({
        buyerEmail: r.buyerEmail,
        reservationCode: r.reservationCode ?? ''
      })
      .pipe(finalize(() => this.cancelling.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Reserva cancelada exitosamente');
          this.reset();
        },
        error: (err) => {
          this.toast.error(err?.errors?.join('\n') || 'Error al cancelar la reserva');
        }
      });
    });
  }

  reset(): void {
    this.reservation.set(null);
    this.errorMsg.set(null);
    this.searchForm.reset();
  }
}
