import { EventType, EventStatus, ReservationStatus } from './enums';
import { EventDto, ReservationDto } from './dto';
import { toApiDateString } from '../utils/date-format';

const STATUS_STRING_TO_ENUM: Record<string, EventStatus> = {
  'Activo': EventStatus.Activo,
  'Cancelado': EventStatus.Cancelado,
  'Completado': EventStatus.Completado,
};

const EVENT_TYPE_STRING_TO_ENUM: Record<string, EventType> = {
  'Conferencia': EventType.Conferencia,
  'Taller': EventType.Taller,
  'Concierto': EventType.Concierto,
};

/**
 * Maps a raw API event object to a properly typed EventDto.
 *
 * The backend sends `status` as a localized string (e.g. "Activo")
 * via JsonStringEnumConverter, and omits `isActive` entirely.
 * This function normalizes both so the rest of the frontend can
 * use numeric enum comparisons and `event.isActive` reliably.
 */
export function mapApiEvent(raw: any): EventDto {
  const status: EventStatus = typeof raw.status === 'number'
    ? (raw.status as EventStatus)
    : (() => {
      if (typeof raw.status === 'string' && !STATUS_STRING_TO_ENUM[raw.status]) {
        console.warn('[Mapper] Unknown EventStatus string:', raw.status);
      }
      return STATUS_STRING_TO_ENUM[raw.status] ?? EventStatus.Cancelado;
    })();

  const type: EventType = typeof raw.type === 'number'
    ? (raw.type as EventType)
    : (() => {
      if (typeof raw.type === 'string' && !EVENT_TYPE_STRING_TO_ENUM[raw.type]) {
        console.warn('[Mapper] Unknown EventType string:', raw.type);
      }
      return EVENT_TYPE_STRING_TO_ENUM[raw.type] ?? EventType.Conferencia;
    })();

  return {
    ...raw,
    status,
    type,
    isActive: status === EventStatus.Activo,
  };
}


const RES_STATUS_STRING_TO_ENUM: Record<string, ReservationStatus> = {
  'PendientePago': ReservationStatus.PendientePago,
  'Confirmada': ReservationStatus.Confirmada,
  'Cancelada': ReservationStatus.Cancelada,
};

/**
 * Maps a raw API reservation object to a properly typed ReservationDto.
 *
 * The backend sends `status` as a localized string (e.g. "Confirmada")
 * via JsonStringEnumConverter. This function normalizes it so the
 * frontend can use numeric enum comparisons (`r.status === 2`,
 * `r.status === ReservationStatus.Confirmada`).
 *
 * Also normalizes the nested `event` via mapApiEvent().
 */
export function mapApiReservation(raw: any): ReservationDto {
  const status: ReservationStatus = typeof raw.status === 'number'
    ? (raw.status as ReservationStatus)
    : (() => {
      if (typeof raw.status === 'string' && !RES_STATUS_STRING_TO_ENUM[raw.status]) {
        console.warn('[Mapper] Unknown ReservationStatus string:', raw.status);
      }
      return RES_STATUS_STRING_TO_ENUM[raw.status] ?? ReservationStatus.PendientePago;
    })();

  return {
    ...raw,
    status,
    event: raw.event ? mapApiEvent(raw.event) : undefined,
  };
}

/**
 * Formats a Date object to an ISO 8601 string WITHOUT timezone (no 'Z' suffix).
 * Uses the browser's local time (not UTC).
 *
 * Example: new Date(2026, 5, 15, 18, 0, 0) → "2026-06-15T18:00:00"
 */
export function formatDateForApi(date: Date): string {
  return toApiDateString(date);
}
