import { Component, EventEmitter, Input, Output, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MaxCapacityValidatorDirective } from '../../../shared/directives/max-capacity-validator.directive';
import { ToastService } from '../../../core/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { EventDto, ReservationDto } from '../../../core/models/dto';
import { SharedPipesModule } from '../../../core/pipes/shared-pipes.module';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventsApi } from '../../../core/services/api/events.api';
import { ReservationsApi } from '../../../core/services/api/reservations.api';

/**
 * Modal that allows a logged‑in user (or guest) to reserve tickets for an event.
 * It first fetches the occupation report to know the real capacity.
 */
@Component({
  selector: 'app-reservation-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    SharedPipesModule,
    MaxCapacityValidatorDirective
  ],
  templateUrl: './reservation-modal.component.html',
  styleUrl: './reservation-modal.component.scss'
})
export class ReservationModalComponent implements OnInit, OnDestroy {
  @Input() event!: EventDto; // event to reserve for
  @Output() reservationCreated = new EventEmitter<ReservationDto>();

  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<ReservationModalComponent>);
  private toast = inject(ToastService);
  private eventsApi = inject(EventsApi);
  private reservationsApi = inject(ReservationsApi);

  form: FormGroup = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]],
    buyerName: ['', [Validators.required, Validators.maxLength(32)]],
    buyerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(64)]]
  });
  loading = false;
  maxAvailable = 0;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.eventsApi.getOccupationReport(this.event.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (report) => {
          this.maxAvailable = report.totalTicketsAvailable;
          this.refreshQuantityValidators();
        },
        error: () => {
          this.maxAvailable = this.event.maxCapacity;
          this.refreshQuantityValidators();
        }
      });
  }

  private refreshQuantityValidators(): void {
    this.form.get('quantity')?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(this.maxAvailable)
    ]);
    this.form.get('quantity')?.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) return;
    const payload = {
      eventId: this.event.id,
      quantity: this.form.value.quantity,
      buyerName: this.form.value.buyerName?.trim(),
      buyerEmail: this.form.value.buyerEmail?.trim()
    };
    this.loading = true;
    this.reservationsApi.create(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (res: ReservationDto) => {
          this.reservationCreated.emit(res);
          this.toast.success(`Reserva creada. Código: ${res.reservationCode || 'Pendiente de confirmación'}`);
          this.dialogRef.close();
        },
        error: err => {
          this.toast.error(err?.errors?.join('\n') || 'Error al crear la reserva');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
