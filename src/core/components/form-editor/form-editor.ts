import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'core-form-editor',
  imports: [],
  templateUrl: './form-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditor { }
