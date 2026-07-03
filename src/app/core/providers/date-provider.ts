export abstract class DateProvider {
  abstract getNow(): Date;
  abstract toApiString(date: Date): string;
}
