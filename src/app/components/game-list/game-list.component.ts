import {
    Component,
    OnInit,
    OnDestroy,
    trigger,
    state,
    style,
    transition,
    animate,
    AfterViewInit,
    Input
} from '@angular/core';
import { GamesService } from '../../services/games.service';
import { AuthService } from '../../services/auth0.service';
import { MainChatService } from '../../services/main-chat.service';
import { Router } from '@angular/router';
import { DoubleConnectionComponent } from '../double-connection/double-connection.component';

@Component({
	selector: 'app-game-list',
	templateUrl: './game-list.component.html',
	styleUrls: ['./game-list.component.sass'],
    animations: [
    trigger('listFlyIn', [
        transition('void => *', [
            style({transform: 'translateX(-200%)'}),
            animate(800)
        ])
    ]),
    trigger('detailsFlyIn', [
        transition('void => *', [
            style({transform: 'translateX(200%)'}),
            animate(800)
        ])
    ])
  ]
})
export class GameListComponent implements OnInit, OnDestroy {
	public games:Array<any>;
	public myGames:Array<any>;
	public selectedGame:any;
	private createGameState:boolean;
	private gameCreatedState:boolean;
	private creationGameName:string;
	private connections:Array<any>;
	private startGameCounter:number;
	private startingNewGame:boolean;
    private showDoubleConnactionError:boolean;
   @Input() animateList;

	constructor(
		private gameService: GamesService,
		private authService:AuthService,
		private mainChatService:MainChatService,
		private router: Router
		) {
		this.connections = [];
	    if (!this.mainChatService.socket_connected
	      && !this.mainChatService.pending_connection) {
	      this.mainChatService.enterIoNamespace('main-hall')
	    }
	}

	ngOnInit() {
		this.myGames = [];
		this.connections.push(this.mainChatService.emitter.subscribe(data=>{
	        this.subscribeToCreation();
			this.subscribeToDeletion();
            this.subscribeToDoubleUserError();
			this.subscribeToSecondConnection();
      	}))

		this.connections.push(this.gameService.getGames().subscribe((games)=>{
			this.games = games;
			this.createGameState = false;
			this.gameCreatedState = false;
		}))
	}

    ngAfterViewInit() {
    }

	private subscribeToCreation():void {
		let observable = this.mainChatService.gameIncoming().subscribe((game:any) => {
			let index = this.games.findIndex(item => item._id === game.data);
			if (index === -1) {
				this.games.push(game.data);
			}
      	})
      	this.connections.push(observable);
	}

	private subscribeToDeletion():void {
		let observable = this.mainChatService.gameDeleted().subscribe((data:any) => {
			let index = this.games.findIndex(item => item._id === data.data);
			if (index !== -1) {
				this.games.splice(index, 1);
			}
      	})
      	this.connections.push(observable);
	}

	private subscribeToSecondConnection():void {
		let observable = this.mainChatService.onSecondConnected().subscribe((data:any) => {
			this.gameService.myGames[0] = data;
			this.deleteGameFromList(data);
			this.processCounter()
				.then(()=>{
					this.gameService.gameOn = data;
					this.router.navigate(['/game', data._id]);
				});
      	})
      	this.connections.push(observable);
	}

	private deleteGameFromList(item) {
		let index = this.games.findIndex(game => game._id === item._id);
		if (index !== -1) {
			this.games.splice(index, 1);
		}
	}

	private processCounter() {
		this.startingNewGame = true;
		return new Promise((resolve, reject) => {
			this.startGameCounter = 4;
			let interval = setInterval(()=>{
				if (!this.startGameCounter) {
					clearInterval(interval);
					resolve();
				} else {
					this.startGameCounter--;
				}

			}, 1000)
		})
	}

	ngOnDestroy() {
		this.mainChatService.socket_connected = false;
		this.connections.forEach(connection =>
			connection.unsubscribe()
		);
  	}

	public createState(turnOn):void {
		this.createGameState = turnOn;
	}

	public selectGame(game):void {
		if (this.selectedGame && this.selectedGame._id === game._id) {
			this.selectedGame = null;
		} else {
			this.selectedGame = game;
		}
	}

	private submitGameCreation():void {
		let newGame = {
			in_lobby: true,
			name: this.creationGameName,
			user_host: {
				"nickname": this.authService.profile.nickname
			},
			user_id: this.authService.profile.user_id,
			players: 1,
			connected_user_id: null,
			connected_user_nickname: null
		};
		this.gameService.createGame(newGame).subscribe((game)=>{
			this.gameService.myGames.push(game);
			this.createGameState = false;
			this.gameCreatedState = true;
		})
		this.creationGameName = "";
	}

    private subscribeToDoubleUserError():void {
        let observable = this.mainChatService.onDoubleAuthError().subscribe(() => {
            this.showDoubleConnactionError = true;
        })
        this.connections.push(observable)
    }

	private stopGame():void {
		this.gameService.deleteGame(this.gameService.myGames[0]._id).subscribe((data)=>{
			this.gameCreatedState = false;
			this.gameService.myGames = [];
		})
	}

	private connectToGame() {
		if (this.authService.authenticated() && this.selectedGame) {
			this.gameService.connectGame(this.selectedGame._id, {
				user_id: this.authService.profile.user_id,
				nickname: this.authService.profile.nickname
			}).subscribe((game)=>{
				this.gameService.gameOn = game;
				this.deleteGameFromList(game);
				this.router.navigate(['/game', game._id]);
			})
		}
	}

	public formatTime(time):string {
		let date = new Date(time);
		return `${date.getHours() > 9 ? date.getHours() : "0" + date.getHours()}:${date.getMinutes() > 9
		? date.getMinutes() : "0" + date.getMinutes()}:${date.getSeconds() > 9
		? date.getSeconds() : "0" + date.getSeconds()}`;
	}
}
