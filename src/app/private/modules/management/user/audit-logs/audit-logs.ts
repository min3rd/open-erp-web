import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'management-user-audit-logs',
  imports: [],
  templateUrl: './audit-logs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogs { }
