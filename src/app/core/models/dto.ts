/**
 * Interfaces that mirror the backend contracts (generated from api‑contract.md).
 * They are deliberately simple – only the fields used by the UI are defined.
 */

export interface VenueDto {
  id: number;
  name: string;
  capacity: number;
  city?: string;
  address?: string;
}

export interface EventDto {
  id: number;
  title: string;
  description?: string;
  type: number;           // numeric enum (see enums.ts) — ANTES era eventType
  status: number;         // numeric enum — ANTES era eventStatus
  isActive: boolean;      // calculado en mapper
  venueId: number;
  venue: VenueDto;
  startDate: string;      // ISO string without Z
  endDate: string;        // NUEVO
  price: number;
  maxCapacity: number;
  creationDate: string;   // NUEVO
}

export interface ReservationDto {
  id: number;                // NUEVO
  eventId: number;           // NUEVO
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  status: number;            // numeric enum ReservationStatus
  reservationCode?: string;  // ANTES era code
  cancelDate?: string;       // NUEVO
  hasPenalty: boolean;       // NUEVO
  creationDate: string;      // NUEVO
  event?: EventDto;
}
