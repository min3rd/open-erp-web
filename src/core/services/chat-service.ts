import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Conversation, Message } from '../interfaces/chat.types';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private _conversations: BehaviorSubject<Conversation[]> = new BehaviorSubject<any>(null);
  private _messages: BehaviorSubject<Message[]> = new BehaviorSubject<any>(null);

  get conversations$(): Observable<Conversation[]> {
    return this._conversations.asObservable();
  }

  get messages$(): Observable<Message[]> {
    return this._messages.asObservable();
  }

  constructor() {}
}
