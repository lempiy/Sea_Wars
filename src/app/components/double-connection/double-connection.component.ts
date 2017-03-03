import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from '../../services/auth0.service';

@Component({
	selector: 'app-double-connection',
	templateUrl: './double-connection.component.html',
	styleUrls: ['./double-connection.component.sass']
})
export class DoubleConnectionComponent implements OnInit {
	@Input() show:boolean;
    constructor(private authService:AuthService) {

    }

    ngOnInit() {
    }

    unauth() {
        this.authService.doubleAuth = true;
        this.show = false;
    }
}
