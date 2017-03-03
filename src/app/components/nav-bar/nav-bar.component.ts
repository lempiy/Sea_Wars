import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth0.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.sass']
})
export class NavBarComponent implements OnInit {
  constructor(public authService:AuthService) {
      this.authService.profile = this.authService.profile || JSON.parse(localStorage.getItem('profile'));
  }

  ngOnInit() {
  }

}
