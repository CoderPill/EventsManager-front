import { Component, OnInit, OnDestroy, inject, signal, ViewChild, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil, debounceTime } from 'rxjs/operators';

import { EventsApi } from '../../../core/services/api/events.api';
import { VenuesApi } from '../../../core/services/api/venues.api';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { EventDto } from '../../../core/models/dto';
import { EnumLabelPipe } from '../../../core/pipes/enum-label.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { ReservationModalComponent } from '../../../shared/components/reservation-modal/reservation-modal.component';
import { OccupationReportModalComponent } from '../../../shared/components/occupation-report-modal/occupation-report-modal.component';
import { CreateEventModalComponent } from '../../../shared/components/create-event-modal/create-event-modal.component';

@Component({
  selector: 'app-events-list-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatButtonModule, MatDialogModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule,
    ReactiveFormsModule,
    EnumLabelPipe, DateFormatPipe,
  ],
  templateUrl: './events-list-page.component.html',
  styleUrl: './events-list-page.component.scss'
})
export class EventsListPageComponent implements OnInit, OnDestroy {
  private eventsApi = inject(EventsApi);
  private venuesApi = inject(VenuesApi);
  private toast = inject(ToastService);
  protected auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  loading = signal(true);
  errorMsg = signal<string | null>(null);
  events = signal<EventDto[]>([]);
  displayedColumns = ['title', 'type', 'startDate', 'price', 'venue', 'status', 'actions'];
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<EventDto>([]);

  filterForm!: FormGroup;

  filters = signal({
    title: '',
    type: '',
    status: '',
    startDateFrom: null as Date | null,
    startDateTo: null as Date | null
  });

  private dataSourceEffect = effect(() => {
    this.dataSource.data = this.filteredEvents();
  });

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      title: [''],
      type: [''],
      status: [''],
      startDateFrom: [null],
      startDateTo: [null]
    });

    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(value => {
        this.filters.set(value);
      });

    this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      if (sortHeaderId === 'venue') {
        return data.venue?.name || '';
      }
      const value = data[sortHeaderId];
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return new Date(value).getTime();
      }
      return value;
    };

    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEvents(): void {
    this.errorMsg.set(null);
    this.loading.set(true);
    this.eventsApi.getAll()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.events.set(data.slice().reverse());
        },
        error: (err) => {
          this.errorMsg.set(err?.errors?.join('\n') || 'Error al cargar eventos');
        }
      });
  }

  filteredEvents = computed(() => {
    const filters = this.filters();
    return this.events().filter(event => {
      if (filters.title && !event.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
      if (filters.type && event.type !== parseInt(filters.type)) return false;
      if (filters.status && event.status !== parseInt(filters.status)) return false;
      if (filters.startDateFrom) {
        const eventStart = new Date(event.startDate);
        if (eventStart < filters.startDateFrom) return false;
      }
      if (filters.startDateTo) {
        const eventStart = new Date(event.startDate);
        const toDate = new Date(filters.startDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (eventStart > toDate) return false;
      }
      return true;
    });
  });

  openReservation(event: EventDto): void {
    const ref = this.dialog.open(ReservationModalComponent, { width: '500px', disableClose: true });
    ref.componentInstance.event = event;
  }

  openCreateEvent(): void {
    const ref = this.dialog.open(CreateEventModalComponent, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadEvents();
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
      case 1: return 'activo';
      case 2: return 'cancelado';
      case 3: return 'completado';
      default: return '';
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      title: '', type: '', status: '',
      startDateFrom: null, startDateTo: null
    });
  }

}
