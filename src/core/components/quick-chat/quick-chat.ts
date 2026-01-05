import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Conversation, Message } from '../../interfaces/chat.types';

@Component({
  selector: 'layout-quick-chat',
  imports: [],
  templateUrl: './quick-chat.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickChat {
  conversations!: Conversation[];
  messages!: Message[];
  selectedConversation!: Conversation;
}
