import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';

@Component({
  selector: 'public-verify-account',
  imports: [],
  templateUrl: './verify-account.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyAccount implements OnInit {

  ngOnInit(): void { }

}
