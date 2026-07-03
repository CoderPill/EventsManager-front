import { NgModule } from '@angular/core';
import { EnumLabelPipe } from './enum-label.pipe';
import { EnumNumberPipe } from './enum-number.pipe';

/**
 * NgModule that bundles the enum pipes for easy import.
 * In a pure standalone‑component world you could also import the pipes directly,
 * but having a module keeps the consumer code tidy.
 */
@NgModule({
  imports: [EnumLabelPipe, EnumNumberPipe],
  exports: [EnumLabelPipe, EnumNumberPipe]
})
export class SharedPipesModule {}
