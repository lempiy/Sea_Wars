import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth0.service';
import { GamesService } from '../../services/games.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.sass']
})
export class UserProfileComponent implements OnInit {
    userGames:Array<any>;
  constructor(private authService:AuthService,
                   private gameService: GamesService) {
      this.gameService.getUserGame(this.authService.profile.user_id).subscribe(data => {
          this.userGames = data.map(game => {
              return {
                  name: game.name,
                  opponent: game.user_id === this.authService.profile.user_id ? game.connected_user_nickname : game.user_host.nickname,
                  timestamp: game.time_stamp,
                  result: game.loser === this.authService.profile.user_id ? "lose" : "win"
              }
          })
      })
  }

    ngOnInit() {

    }
  	public formatTime(time):string {
		let date = new Date(time);
		return `${date.getDate() > 9
        ? date.getDate() : "0" + date.getDate()}.${date.getMonth() + 1 > 9
        ? date.getMonth()  + 1 : "0" + (date.getMonth() + 1)} ${date.getHours() > 9
        ? date.getHours() : "0" + date.getHours()}:${date.getMinutes() > 9
		? date.getMinutes() : "0" + date.getMinutes()}`;
	}
}
