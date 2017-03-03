import { Injectable, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from "rxjs/Observable";
import * as io from "socket.io-client";
import { SocketAnswer } from "../definitions/socket-answer.interface";
import { RemoteGameEvent } from '../definitions/remote-game-event.interface';



@Injectable()
export class MainChatService {
    private url:string;
    private fullUrl:string;
    private socket:any;
    private user_id:string;
    private user_nickname:string;
    public users_in_mainhall:number;
    public socket_connected: boolean;
    public pending_connection: boolean;
    public emitter: EventEmitter<any>;

    constructor() {
        this.emitter = new EventEmitter();
        this.url = '/'
        this.parseUserData()
    }

    private parseUserData() {
        let profile = JSON.parse(localStorage.getItem('profile'));
        this.user_id = profile ? profile.user_id : "";
        this.user_nickname = profile ? profile.nickname : "";
        this.users_in_mainhall = 0;
    }

    public enterIoNamespace(namespace:string, ...params:Array<any>):any {
        //TODO: ADD Event Emmiter Logic
        this.socket_connected = false;
        this.pending_connection = true;
        this.parseUserData();
        this.fullUrl = `${this.url}${namespace}`;
        if (this.socket) this.socket.disconnect();
        let moreParams = params.length ? params.reduce((acc, p) => `${acc}&${p.key}=${p.value}`,"") : "";
        this.socket = io.connect(this.fullUrl, {
            query: `token=${localStorage.getItem('id_token')}&user_data=${this.user_id}&user_nickname=${this.user_nickname}${moreParams}`,
            forceNew: true
        });
        this.socket.on('connect', (data:any) => {
            this.emitter.emit(data);
            this.pending_connection = false;
            this.socket_connected = true;
        });

    }

    public emit(eventname:string, data?:any) {
        this.socket.emit(eventname, data)
    }

    public sendMessage(data:any) {
        this.socket.emit('add-message', data)
    }

    public connectToGame(data:any) {
        this.socket.emit('connect-game', data)
    }

    public gameLoaded(data:any) {
        this.socket.emit('loaded-to-game', data)
    }

    public onDoubleAuthError():Observable<any> {
        return this.subscribeSocketToEvent<any>('user-already-online')
        //
    }

    public onChangeAmountInMainHall():Observable<SocketAnswer> {
        return this.subscribeSocketToEvent<SocketAnswer>('users-amount-changed')
    }

    // TODO: add typing
    public onNewJoke():Observable<SocketAnswer> {
        return this.subscribeSocketToEvent<SocketAnswer>('new-joke')
    }

    public onEnemyLeaved():Observable<RemoteGameEvent> {
        return this.subscribeSocketToEvent<RemoteGameEvent>('player-leave')
    }

    public onPlayerGameResult():Observable<RemoteGameEvent> {
        return this.subscribeSocketToEvent<RemoteGameEvent>('player-lost')
    }

    public onPlayerLandedShips():Observable<RemoteGameEvent> {
        return this.subscribeSocketToEvent<RemoteGameEvent>('player-landed-ships')
    }

    public onPlayerFired():Observable<RemoteGameEvent> {
        return this.subscribeSocketToEvent<RemoteGameEvent>('player-fire')
    }

    public onPlayerFireResult():Observable<RemoteGameEvent> {
        return this.subscribeSocketToEvent<RemoteGameEvent>('player-fire-result')
    }

    public onUsersReady() {
        return this.subscribeSocketToEvent<any>('users-ready')
    }

    public onSecondConnected() {
        return this.subscribeSocketToEvent<any>('second-connected')
    }

    public gameIncoming() {
        return this.subscribeSocketToEvent<any>('created-game')
    }

    public gameDeleted() {
        return this.subscribeSocketToEvent<any>('deleted-game')
    }

    public getMessages():Observable<SocketAnswer> {
        let observable = new Observable((observer:any) => {
            this.socket.on('message', (data:any)=> {
                observer.next(data);
            });
            return () => {
                this.socket.disconnect();
            }
        })
        return observable;
    }

    private subscribeSocketToEvent<T>(eventname:string):Observable<T> {
        return new Observable((observer:any) => {
            this.socket.on(eventname, (data:any)=> {
                observer.next(data);
            });
        });
    }
}
