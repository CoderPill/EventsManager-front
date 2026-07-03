import { Component, inject, OnInit, OnDestroy, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil, debounceTime } from 'rxjs/operators';

import { ReservationsApi } from '../../../core/services/api/reservations.api';
import { ToastService } from '../../../core/services/toast.service';
import { EnumLabelPipe } from '../../../core/pipes/enum-label.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { ReservationDto, ReservationStatus, CancelReservationRequest } from '../../../core/models';
import { OccupationReportModalComponent } from '../../../shared/components/occupation-report-modal/occupation-report-modal.component';

interface FilterFormValue {
  code: string;
  event: string;
  buyer: string;
  email: string;
  status: string;
  dateFrom: Date | null;
  dateTo: Date | null;
}

@Component({
  selector: 'app-all-reservations',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDividerModule,
    MatDatepickerModule, MatNativeDateModule,
    ReactiveFormsModule,
    EnumLabelPipe, DateFormatPipe,
  ],
  templateUrl: './all-reservations.component.html',
  styleUrl: './all-reservations.component.scss',
})
export class AllReservationsComponent implements OnInit, OnDestroy {
  ReservationStatus = ReservationStatus;

  private reservationsApi = inject(ReservationsApi);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  loading = signal(false);
  cancelling = signal(false);
  confirming = signal(false);
  reservations = signal<ReservationDto[]>([]);
  errorMsg = signal<string | null>(null);
  private destroy$ = new Subject<void>();

  displayedColumns = ['code', 'event', 'buyer', 'email', 'quantity', 'creationDate', 'status', 'action'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filters = signal({
    code: '',
    event: '',
    buyer: '',
    email: '',
    status: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
  });

  filterForm = this.fb.group({
    code: [''],
    event: [''],
    buyer: [''],
    email: [''],
    status: [''],
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null],
  });

  dataSource = new MatTableDataSource<ReservationDto>([]);

  private dataSourceEffect = effect(() => {
    this.dataSource.data = this.filteredReservations();
  });

  filteredReservations = computed(() => {
    const filters = this.filters();
    return this.reservations().filter(r => {
      if (filters.code && !r.reservationCode?.toLowerCase().includes(filters.code.toLowerCase())) {
        return false;
      }
      if (filters.event && !r.event?.title?.toLowerCase().includes(filters.event.toLowerCase())) {
        return false;
      }
      if (filters.buyer && !r.buyerName?.toLowerCase().includes(filters.buyer.toLowerCase())) {
        return false;
      }
      if (filters.email && !r.buyerEmail?.toLowerCase().includes(filters.email.toLowerCase())) {
        return false;
      }
      if (filters.status && r.status !== parseInt(filters.status)) {
        return false;
      }
      if (filters.dateFrom) {
        const resDate = new Date(r.creationDate);
        if (resDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const resDate = new Date(r.creationDate);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (resDate > toDate) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: ReservationDto, sortHeaderId: string) => {
      const fieldMap: Record<string, string> = {
        code: 'reservationCode',
        buyer: 'buyerName',
        email: 'buyerEmail',
      };
      const field = fieldMap[sortHeaderId] || sortHeaderId;

      if (field === 'event') {
        return data.event?.title || '';
      }

      const value = (data as any)[field];
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return new Date(value).getTime();
      }
      return value ?? '';
    };

    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(value => {
        this.filters.set(value as FilterFormValue);
      });
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReservations(): void {
    this.errorMsg.set(null);
    this.loading.set(true);
    this.reservationsApi
      .getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.reservations.set(data.slice().reverse());
        },
        error: (err) => {
          this.errorMsg.set(err?.errors?.join('\n') || 'Error al cargar reservas');
        },
      });
  }

  onCancel(reservation: ReservationDto): void {
    this.toast
      .confirm(
        `¿Cancelar reserva ${reservation.reservationCode ?? ''}?`,
        'El comprador será notificado.'
      )
      .then(confirmed => {
        if (!confirmed) return;

        this.cancelling.set(true);
        const request: CancelReservationRequest = {
          buyerEmail: reservation.buyerEmail,
          reservationCode: reservation.reservationCode ?? ''
        };
        this.reservationsApi
          .cancel(request)
          .pipe(finalize(() => this.cancelling.set(false)))
          .subscribe({
            next: () => {
              this.toast.success('Reserva cancelada correctamente');
              this.loadReservations();
            },
            error: (err) =>
              this.toast.error(err?.errors?.join('\n') || 'Error al cancelar'),
          });
      });
  }

  onConfirm(reservation: ReservationDto): void {
    this.toast.confirm(
      `¿Confirmar reserva ${reservation.reservationCode ?? ''}?`,
      'Se marcará como Confirmada.'
    ).then(confirmed => {
      if (!confirmed) return;
      this.confirming.set(true);
      this.reservationsApi.confirm({
        reservationId: reservation.id
      }).pipe(finalize(() => this.confirming.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Reserva confirmada correctamente');
          this.loadReservations();
        },
        error: (err) => this.toast.error(err?.errors?.join('\n') || 'Error al confirmar')
      });
    });
  }

  openReport(eventId: number): void {
    this.dialog.open(OccupationReportModalComponent, {
      width: '500px',
      data: { eventId }
    });
  }

  getStatusClass(status: number): string {
    switch (status) {
      case ReservationStatus.Confirmada: return 'confirmada';
      case ReservationStatus.PendientePago: return 'pendientepago';
      case ReservationStatus.Cancelada: return 'cancelada';
      default: return '';
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      code: '', event: '', buyer: '', email: '',
      status: '', dateFrom: null, dateTo: null
    });
  }

  getStatusColor(status: number): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case ReservationStatus.Confirmada:
        return 'primary';
      case ReservationStatus.PendientePago:
        return 'accent';
      case ReservationStatus.Cancelada:
        return 'warn';
      default:
        return 'primary';
    }
  }
}
