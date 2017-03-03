import { Injectable } from '@angular/core';
import { tokenNotExpired } from 'angular2-jwt';
import { Router } from '@angular/router';
import { MainChatService } from './main-chat.service';
import { options } from "../auth.options";

declare var Auth0Lock: any;

@Injectable()
export class AuthService {
	public profile:any;
    public doubleAuth:boolean;
	// We'll use the Auth0 Lock widget for capturing user credentials
	lock = new Auth0Lock('Ni77Og6znRV9N0N1NVkhHcjopHImm4xp', 'lempiy.eu.auth0.com', options);

	constructor(private router: Router, private mainChatService: MainChatService) {
		// We'll listen for an authentication event to be raised and if successful will log the user in.
		this.lock.on('authenticated', (authResult: any) => {
			localStorage.setItem('id_token', authResult.idToken);
			this.lock.getProfile(authResult.idToken, (error: any, profile: any) => {
                this.doubleAuth = false;
				if (error) {
					console.log(error);
				}
				this.profile = profile;
				localStorage.setItem('profile', JSON.stringify(profile));
				//location.reload();
                this.mainChatService.enterIoNamespace('main-hall')
			});

			this.lock.hide();
		});
	}

	// This method will display the lock widget
	public login() {
		this.lock.show();
	}

	public authenticated() {
		// Check if there's an unexpired JWT
		// This searches for an item in localStorage with key == 'id_token'
		return tokenNotExpired();
	}

	// This method will log the use out
	public logout() {
		// To log out, just remove the token and profile
		// from local storage
		localStorage.removeItem('profile');
		localStorage.removeItem('id_token');
        this.doubleAuth = false;

		// Send the user back to the public deals page after logout
		location.reload();
	}
}
