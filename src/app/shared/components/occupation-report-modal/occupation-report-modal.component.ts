import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { EventsApi } from '../../../core/services/api/events.api';
import { OccupationReport } from '../../../core/services/event.service';

/**
 * Modal that shows the occupation report for a given event.
 */
@Component({
  selector: 'app-occupation-report-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './occupation-report-modal.component.html',
  styleUrl: './occupation-report-modal.component.scss'
})
export class OccupationReportModalComponent implements OnInit {
  report: OccupationReport | null = null;
  errorMessage: string | null = null;
  loading = signal(true);

  private dialogRef = inject(MatDialogRef<OccupationReportModalComponent>);
  public data = inject<{ eventId: number }>(MAT_DIALOG_DATA);
  private eventsApi = inject(EventsApi);

  ngOnInit(): void {
    this.eventsApi.getOccupationReport(this.data.eventId).subscribe({
      next: (data) => {
        this.report = data;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[OccupationReport] Error:', err);
        this.errorMessage = err?.errors?.join('\n') || err?.message || 'No se pudo cargar el reporte';
        this.loading.set(false);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
