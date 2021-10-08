import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HubConnection } from '@microsoft/signalr';
import { NewsItem } from './models/news-item';
import { Store } from '@ngrx/store';
import * as newsAction from './store/news.action';
import * as signalR from '@microsoft/signalr';
import { Observable } from 'rxjs';

@Injectable()
export class NewsService {
  private hubConnection: HubConnection | undefined;
  private actionUrl: string;
  private headers: HttpHeaders;

  constructor(private http: HttpClient, private store: Store<any>) {
    this.init();
    this.actionUrl = 'http://localhost:5000/api/news/';

    this.headers = new HttpHeaders();
    this.headers = this.headers.set('Content-Type', 'application/json');
    this.headers = this.headers.set('Accept', 'application/json');
  }

  send(newsItem: NewsItem): NewsItem {
    if (this.hubConnection) {
      this.hubConnection.invoke('Send', newsItem);
    }
    return newsItem;
  }

  joinGroup(group: string): void {
    if (this.hubConnection) {
      this.hubConnection.invoke('JoinGroup', group);
    }
  }

  leaveGroup(group: string): void {
    if (this.hubConnection) {
      this.hubConnection.invoke('LeaveGroup', group);
    }
  }

  getAllGroups(): Observable<string[]> {
    return this.http.get<string[]>(this.actionUrl, { headers: this.headers });
  }

  private init() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/looney')
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.start().catch((err) => console.error(err.toString()));

    this.hubConnection.on('Send', (newsItem: NewsItem) => {
      this.store.dispatch(
        newsAction.recieveNewsItemAction({ payload: newsItem })
      );
    });

    this.hubConnection.on('JoinGroup', (data: string) => {
      console.log('recieved data from the hub');
      console.log(data);
      this.store.dispatch(
        newsAction.recieveGroupJoinedAction({ payload: data })
      );
    });

    this.hubConnection.on('LeaveGroup', (data: string) => {
      this.store.dispatch(newsAction.recieveGroupLeftAction({ payload: data }));
    });

    this.hubConnection.on('History', (newsItems: NewsItem[]) => {
      console.log('recieved history from the hub');
      console.log(newsItems);
      this.store.dispatch(
        newsAction.recieveNewsGroupHistoryAction({ payload: newsItems })
      );
    });
  }
}
