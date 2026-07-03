import { Component, EventEmitter, Output, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { finalize } from 'rxjs/operators';
import { SharedPipesModule } from '../../../core/pipes/shared-pipes.module';
import { EventDto, VenueDto } from '../../../core/models/dto';
import { ToastService } from '../../../core/services/toast.service';
import { EventsApi } from '../../../core/services/api/events.api';
import { VenuesApi } from '../../../core/services/api/venues.api';
import { formatDateForApi } from '../../../core/models/mappers';

/**
 * Modal for creating a new event (admin only).
 * Uses enum‑number pipe to convert the selected label back to numeric value.
 */
@Component({
  selector: 'app-create-event-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SharedPipesModule
  ],
  templateUrl: './create-event-modal.component.html',
  styleUrl: './create-event-modal.component.scss'
})
export class CreateEventModalComponent implements OnInit {
  @Output() eventCreated = new EventEmitter<EventDto>();

  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<CreateEventModalComponent>);
  private toast = inject(ToastService);
  private eventsApi = inject(EventsApi);
  private venuesApi = inject(VenuesApi);

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    eventType: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    venueId: ['', Validators.required],
    maxCapacity: [1, [Validators.required, Validators.min(1)]]
  }, { validators: [this.dateRangeValidator(), this.futureDateValidator(), this.capacityValidator()] });
  loading = false;
  venues = signal<VenueDto[]>([]);

  private dateRangeValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('startDate')?.value;
      const end = group.get('endDate')?.value;
      if (start && end && new Date(end) <= new Date(start)) {
        return { dateAfterStart: true };
      }
      return null;
    };
  }

  private futureDateValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const start = group.get('startDate')?.value;
      if (start && new Date(start) <= new Date()) {
        return { futureDate: true };
      }
      return null;
    };
  }

  private capacityValidator(): ValidatorFn {
    return (group: AbstractControl) => {
      const venueId = group.get('venueId')?.value;
      const maxCap = group.get('maxCapacity')?.value;
      if (venueId && maxCap) {
        const venue = this.venues().find(v => v.id === Number(venueId));
        if (venue && maxCap > venue.capacity) {
          group.get('maxCapacity')?.setErrors({ ...group.get('maxCapacity')?.errors, exceedsVenue: true });
        }
      }
      return null;
    };
  }

  ngOnInit(): void {
    this.venuesApi.getAll().subscribe({
      next: (data) => this.venues.set(data),
      error: () => this.toast.error('Error al cargar venues')
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.value;
    // Convert eventType label → number using EnumNumberPipe logic (simplified inline)
    const eventTypeMap = { Conferencia: 1, Taller: 2, Concierto: 3 } as const;
    const eventTypeNum = eventTypeMap[raw.eventType as keyof typeof eventTypeMap];
    if (!eventTypeNum) {
      this.toast.error('Tipo de evento no válido');
      return;
    }
    const payload = {
      title: raw.title?.trim(),
      description: raw.description?.trim(),
      eventType: eventTypeNum,
      startDate: formatDateForApi(new Date(raw.startDate)),
      endDate: formatDateForApi(new Date(raw.endDate)),
      price: raw.price,
      venueId: raw.venueId,
      maxCapacity: raw.maxCapacity
    };
    this.loading = true;
    this.eventsApi.create(payload)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: EventDto) => {
          this.eventCreated.emit(data);
          this.toast.success('Evento creado exitosamente');
          this.dialogRef.close(true);
        },
        error: err => {
          const msg = err?.errors?.join('\n') || err?.message || 'Error al crear evento';
          this.toast.error(msg);
        }
      });
  }
}
