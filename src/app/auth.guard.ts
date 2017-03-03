import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { AuthService } from './services/auth0.service';

@Injectable()

export class AuthGuard implements CanActivate {
    constructor(private auth:AuthService, private router:Router){

    }
    canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if(this.auth.authenticated()) {
            console.log("AUTH GUARD PASSED")
            return true;
        } else {
            console.log("BLOCKED BY AUTH GUARD")
            this.router.navigate(['/']);
            return false;
        }
    }
}
