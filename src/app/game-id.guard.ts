import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { GamesService } from './services/games.service';

@Injectable()

export class GameIdGuard implements CanActivate {
    constructor(private gamesService:GamesService, private router:Router){

    }
    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if( this.gamesService.gameOn &&
            this.gamesService.gameOn._id === next.params['id']) {
            return true;
        } else {
            console.log("NO GAME FOUND")
            this.router.navigate(['/']);
            return false;
        }
    }
}
