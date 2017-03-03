import { Component, OnInit, OnDestroy, EventEmitter, ViewChild, AfterViewInit, ViewChildren, QueryList  } from '@angular/core';
import { GamesService } from '../../services/games.service';
import { GameplayService } from '../../services/gameplay.service';
import { AuthService } from '../../services/auth0.service';
import { MainChatService } from '../../services/main-chat.service';
import { SoundService } from '../../services/sound.service';
import { Router } from '@angular/router';
import { RerunAnimationDirective } from '../../directives/rerun-animation.directive';
import { InnerEvent } from "../../definitions/inner-event.interface";
import { GameStats } from "../../definitions/game-stats.interface";
import  { replics } from "../../constants/replics.constant";
import { Subscription } from "rxjs/Subscription";
import * as PIXI from 'pixi.js';

@Component({
	selector: 'app-game',
	templateUrl: './game.component.html',
	styleUrls: ['./game.component.sass'],
})
export class GameComponent implements OnInit, OnDestroy {
	private connections:Array<Subscription>;
	private rendererAlly:PIXI.SystemRenderer;
	private stageAlly:PIXI.Container;
	private rendererEnemy:PIXI.SystemRenderer;
	private stageEnemy:PIXI.Container;
    private captainReplic:string;
    private resourcesLoaded:boolean;
    private loadingMessage:string;
    public stats:GameStats;


	constructor(
		private gameService: GamesService,
		private gameplayService:GameplayService,
		private authService:AuthService,
		private mainChatService:MainChatService,
        private soundService:SoundService,
		private router: Router
	) {
		this.connections = [];
        this.stats = {
            totalMoves: 0,
            playerMoves: 0,
            playerStreak: 0,
            enemyMoves: 0,
            enemyStreak: 0
        }
        this.resourcesLoaded = false;
        this.loadingMessage = "Loading textures...";
		// if (!this.mainChatService.socket_connected
	 //      && !this.mainChatService.pending_connection) {
	 //      this.mainChatService.enterIoNamespace('game', { key: "game_id", value: this.gameService.gameOn._id });
	 //    }
	}
    @ViewChild(RerunAnimationDirective) rerun:RerunAnimationDirective
    @ViewChildren(RerunAnimationDirective) rerunAll:QueryList<RerunAnimationDirective>

	ngOnDestroy() {
        this.connections.forEach(connection =>
            connection.unsubscribe()
        );
	}

    private subscribeToLocalGameEvents() {
        this.connections.push(
            this.gameplayService.emitter.subscribe(event => this.gameEventHandler(event))
        );
    }

    private subscribeToRemoteGameEvents() {
        this.connections.push(
            this.subscribeToShipsLanding(),
            this.subscribeToPlayerFire(),
            this.subscribeToPlayerFireResult(),
            this.subscribeToPlayerGameResult(),
            this.subscribeToEnemyLeave(),
            this.subscribeToJokes()
        )
    }

    // BEGIN remote subscribtions
    private subscribeToShipsLanding() {
        return this.mainChatService.onPlayerLandedShips().subscribe(data => {
            if (data.player_id === this.authService.profile.user_id) {
                this.gameplayService.playerLandedShips = true;
            } else if (data.player_id === this.gameService.gameOn.connected_user_id
                || data.player_id === this.gameService.gameOn.user_id) {
                this.gameplayService.enemyLandedShips = true;
            }
            if (this.isLandningStageOver()) {
                let playersTurn = data.players_turn === this.authService.profile.user_id
                this.gameplayService.beginBattleStage(playersTurn)
                this.playTalkAnimation(`Let the battle begin! Its your ${!playersTurn ? 'enemy' : ''} turn to shoot.`)
            }
        })
    }

    private subscribeToJokes() {
        return this.mainChatService.onNewJoke().subscribe(data => {
            this.playTalkAnimation(data.data.value.joke)
        })
    }

    private subscribeToEnemyLeave() {
        return this.mainChatService.onEnemyLeaved().subscribe(data => {
            if (this.gameplayService.gameState !== "win" && this.gameplayService.gameState !== "lose") {
                this.playTalkAnimation(`Coward enemy has leaved...`)
                this.gameplayService.gameState = "disconnected";
            }
        })
    }

    private subscribeToPlayerFire() {
        return this.mainChatService.onPlayerFired().subscribe(data => {
            if (data.player_id === this.authService.profile.user_id) {
                // if player fired
            } else {
                this.gameplayService.onEnemyFired(data.event)
            }
        })
    }

    private subscribeToPlayerFireResult() {
        return this.mainChatService.onPlayerFireResult().subscribe(data => {
            if (data.player_id === this.authService.profile.user_id) {
                this.gameplayService.onEnemyFireResults(data.event)
                this.talkAboutEnemyEvents(data.event)
            } else {
                this.gameplayService.onPlayerFireResults(data.event)
                this.talkAboutPlayerEvents(data.event)
            }
        })
    }

    private subscribeToPlayerGameResult() {
        return this.mainChatService.onPlayerGameResult().subscribe(data => {
            this.calculateStats()
            if (data.player_id === this.authService.profile.user_id) {
                this.gameplayService.onEnemyWin(data.event)
                this.playTalkAnimation(`Shameful lose. Good luck next battle.`);
            } else {
                this.gameplayService.onPlayerWin(data.event)
                this.playTalkAnimation(`Glorious victory. Congratulations, captain!`);
            }
        })
    }

    // END remote subscribtions
    private isLandningStageOver():boolean {
        return this.gameplayService.enemyLandedShips &&
            this.gameplayService.playerLandedShips
    }

    private gameEventHandler(event: InnerEvent) {
        switch (event.event) {
            case "ships-landed":
                this.onShipsLanded();
                break;
            case "fire":
                this.mainChatService.emit(event.event, event)
                break;
            case "fire-result":
                this.mainChatService.emit(event.event, event)
                break;
            case "lost":
                this.mainChatService.emit(event.event, event)
        }
    }

    private onShipsLanded() {
        this.mainChatService.emit("ships-landed")
        this.playTalkAnimation("Well done, sea wolf. Now wait your opponent to finish landing.")
    }

	ngOnInit() {
        let usersReadyObserver = this.mainChatService.onUsersReady()
            .subscribe(data => {
                this.gameplayService.beginLandingStage()
                this.playTalkAnimation("Land your ships, sailor. Or click on me and I'll finish it for you.")
                usersReadyObserver.unsubscribe()
            })
        this.connections.push(usersReadyObserver)
        this.gameplayService.init()
        .then(() => {
            this.loadingMessage = "Loading sounds...";
            return this.soundService.loadSounds()
        })
        // Promise.all([this.gameplayService.init(), this.soundService.loadSounds()])
        .then(() => {
            this.loadingMessage = "Done!";
            this.resourcesLoaded = true;
            this.mainChatService.gameLoaded({
                game_id: this.gameService.gameOn._id,
                own_user_id: this.authService.profile.user_id,
                enemy_user_id: this.gameService.gameOn.connected_user_id == this.authService.profile.user_id ?
                    this.gameService.gameOn.user_id : this.gameService.gameOn.connected_user_id
            })
            this.subscribeToLocalGameEvents();
            this.subscribeToRemoteGameEvents();
            this.playTalkAnimation(`Welcome, Comrade ${this.authService.profile.nickname}! Wait, your opponent is loading.`);
        })
	}

    private randomLanding() {
        this.gameplayService.randomLanding()
    }

    captainClickHandler() {
        if (this.gameplayService.gameState === "landing") {
            this.gameplayService.randomLanding()
        } else {
            this.playTalkAnimation()
        }
    }

    playTalkAnimation(text?:string, isShort?:boolean) {
        if (text) {
            this.captainReplic = ""
            this.captainReplic = text
        }
        this.rerunAll.first.rerun(isShort)
        this.rerunAll.last.rerun(isShort)
    }

    talkAboutPlayerEvents(event:any) {
        if (event.killed) {
            let replicIndex = this.getRandomInt(0, replics.player_kill.length - 1)
            this.playTalkAnimation(replics.player_kill[replicIndex])
        } else if (event.hit) {
            let replicIndex = this.getRandomInt(0, replics.player_hit.length - 1)
            this.playTalkAnimation(replics.player_hit[replicIndex])
        } else {
            let replicIndex = this.getRandomInt(0, replics.player_missed.length - 1)
            this.playTalkAnimation(replics.player_missed[replicIndex])
        }
    }

    talkAboutEnemyEvents(event:any) {
        if (event.killed) {
            let replicIndex = this.getRandomInt(0, replics.enemy_kill.length - 1)
            this.playTalkAnimation(replics.enemy_kill[replicIndex])
        } else if (event.hit) {
            let replicIndex = this.getRandomInt(0, replics.enemy_hit.length - 1)
            this.playTalkAnimation(replics.enemy_hit[replicIndex])
        } else {
            let replicIndex = this.getRandomInt(0, replics.enemy_missed.length - 1)
            this.playTalkAnimation(replics.enemy_missed[replicIndex])
        }
    }

    saveResults() {
        let data = {
            stats: this.stats,
            logs: this.gameplayService.gameLogger
        }
        this.gameService.saveGameResults(this.gameService.gameOn._id, data)
            .subscribe(data => {
                this.router.navigate(['/']);
            })
    }

    private calculateStats() {
        this.stats.totalMoves = this.gameplayService.gameLogger.length
        this.stats.playerMoves = 0
        this.stats.playerStreak = 0
        let streakPlayerCandidate = 0

        this.stats.enemyMoves = 0
        this.stats.enemyStreak = 0
        let streakEnemyCandidate = 0

        this.gameplayService.gameLogger
            .forEach(move=> {
                if (move.byPlayer) {
                    this.stats.playerMoves++
                    if (move.hit) {
                        ++streakPlayerCandidate
                        this.stats.playerStreak = this.stats.playerStreak < streakPlayerCandidate ? streakPlayerCandidate : this.stats.playerStreak
                    } else {
                        streakPlayerCandidate = 0
                    }

                } else {
                    this.stats.enemyMoves++
                    if (move.hit) {
                        ++streakEnemyCandidate
                        this.stats.enemyStreak = this.stats.enemyStreak < streakEnemyCandidate ? streakEnemyCandidate : this.stats.enemyStreak
                    } else {
                        streakEnemyCandidate = 0
                    }
                }
            })
    }

    private getRandomInt(min:number, max:number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

