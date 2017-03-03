import {Injectable} from '@angular/core';
import {Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import { IGame } from '../definitions/game.interface';
import { Observable } from "rxjs/Observable";

@Injectable()
export class GamesService {
    private url:string;
    public pendingRequest: boolean;
    public myGames:Array<IGame>;
    public gameOn:IGame;

  constructor(private _http:Http) {
        this.url = ""
        this.myGames = [];
    }

    getGames():Observable<IGame[]>{
        this.pendingRequest = true;
        return this._http.get(`${this.url}/api/v1/games`)
            .map(res => {
                this.pendingRequest = false;
                if (res.status < 400) {
                    return res.json()
                }
            });
    }
    createGame(game):Observable<IGame> {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        this.pendingRequest = true;
        return this._http.post(`${this.url}/api/v1/game`, JSON.stringify(game), {headers: headers})
            .map(res => {
                this.pendingRequest = false;
                if (res.status < 400) {
                    return res.json()
                }
            });
    }

    updateGame(game):Observable<IGame> {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        this.pendingRequest = true;
        return this._http.put(`${this.url}/api/v1/game/${game._id}`, JSON.stringify(game), {headers: headers})
            .map(res => {
                this.pendingRequest = false;
                if (res.status < 400) {
                    return res.json()
                }
            });
    }

    connectGame(game_id, data):Observable<IGame> {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        this.pendingRequest = true;
        return this._http.put(`${this.url}/api/v1/game-connect/${game_id}`, JSON.stringify(data), {headers: headers})
            .map(res => {
                this.pendingRequest = false;
                if (res.status < 400) {
                    return res.json()
                }
            });
    }

    saveGameResults(game_id, data):Observable<IGame> {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        this.pendingRequest = true;
        return this._http.put(`${this.url}/api/v1/save-result/${game_id}`, JSON.stringify(data), {headers: headers})
            .map(res => {
                this.pendingRequest = false;
                if (res.status < 400) {
                    return res.json()
                }
            });
    }

    getUserGame(user_id:string):Observable<IGame[]> {
        var headers = new Headers();
        headers.append('Content-Type', 'application/json');
        this.pendingRequest = true;
        return this._http.get(`${this.url}/api/v1/user-games/${user_id}`, {headers: headers})
            .map(res => {
                this.pendingRequest = false;
                if (res.status < 400) {
                    return res.json()
                }
            });
    }

    deleteGame(id) {
        this.pendingRequest = true;
        return this._http.delete(`${this.url}/api/v1/game/${id}`)
            .map(res => {
                this.pendingRequest = false;
                if (res.status < 400) {
                    return res.json()
                }
            });
    }
}
