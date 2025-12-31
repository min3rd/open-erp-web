import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { Layout } from '../../core/layout/layout';
import { LayoutType } from '../../core/layout/layout.service';

interface MailItem {
  id: number;
  sender: string;
  subject: string;
  preview: string;
  label: string;
  severity: 'info' | 'success' | 'warn' | 'danger' | 'secondary';
  time: string;
  unread?: boolean;
  avatar: string;
}

@Component({
  selector: 'app-private-demo',
  imports: [CommonModule, NgOptimizedImage, ButtonModule, TagModule, CheckboxModule, Layout],
  templateUrl: './private-demo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivateDemo {
  readonly layoutType = signal<LayoutType>('vertical');
  readonly userPermissions = ['mail:important'];

  readonly mails = signal<MailItem[]>([
    {
      id: 1,
      sender: 'Brook Simmons',
      subject: 'Important Account Update',
      preview: 'We have updated your account security settings.',
      label: 'Security',
      severity: 'danger',
      time: '3:24 PM',
      unread: true,
      avatar: 'https://i.pravatar.cc/64?img=14',
    },
    {
      id: 2,
      sender: 'Dianne Russell',
      subject: 'Weekly Project Update',
      preview: 'Attached is the weekly project report.',
      label: 'Update',
      severity: 'info',
      time: '11:24 AM',
      avatar: 'https://i.pravatar.cc/64?img=8',
    },
    {
      id: 3,
      sender: 'Amy Elsner',
      subject: 'Urgent: Security Alert',
      preview: 'Please review the recent login attempts.',
      label: 'Security',
      severity: 'danger',
      time: '9:24 AM',
      unread: true,
      avatar: 'https://i.pravatar.cc/64?img=9',
    },
    {
      id: 4,
      sender: 'Jacob Jones',
      subject: 'Exclusive Offer Inside',
      preview: 'Limited time only for our loyal customers.',
      label: 'Marketing',
      severity: 'warn',
      time: 'Jan 21',
      avatar: 'https://i.pravatar.cc/64?img=7',
    },
    {
      id: 5,
      sender: 'Cameron Watson',
      subject: 'Employee Appreciation Event',
      preview: 'Save the date for our upcoming celebration.',
      label: 'HR',
      severity: 'success',
      time: 'Jan 15',
      avatar: 'https://i.pravatar.cc/64?img=6',
    },
  ]);

  setLayout(type: LayoutType): void {
    this.layoutType.set(type);
  }
}
