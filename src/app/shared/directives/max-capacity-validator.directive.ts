import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, Validator, ValidatorFn, NG_VALIDATORS } from '@angular/forms';

export function maxQuantityValidator(max: number): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.value == null || control.value === '' || typeof max !== 'number' || max <= 0) {
      if (max <= 0) {
        console.warn('[MaxCapacityValidator] maxCapacity is <= 0, validation disabled');
      }
      return null;
    }
    return control.value > max ? { maxQuantity: { max, actual: control.value } } : null;
  };
}

@Directive({
  selector: '[appMaxCapacity]',
  standalone: true,
  providers: [
    { provide: NG_VALIDATORS, useExisting: MaxCapacityValidatorDirective, multi: true }
  ]
})
export class MaxCapacityValidatorDirective implements Validator, OnChanges {
  @Input('appMaxCapacity') maxCapacity: number = 0;
  
  private validator: ValidatorFn = () => null;
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['maxCapacity']) {
      this.validator = maxQuantityValidator(this.maxCapacity);
    }
  }
  
  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.validator(control);
  }
}
