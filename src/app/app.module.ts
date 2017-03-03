import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, Http, RequestOptions } from '@angular/http';
import { AuthHttp, AuthConfig } from 'angular2-jwt';

import { AppComponent } from './app.component';
import { MainhallComponent } from './components/mainhall/mainhall.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

import { AuthService } from './services/auth0.service';
import { MainChatService } from './services/main-chat.service';
import { GamesService } from './services/games.service';
import { GameplayService } from './services/gameplay.service';
import { SoundService } from './services/sound.service';
import { AuthGuard } from './auth.guard';
import { GameIdGuard } from './game-id.guard';

import { routing, appRoutesProviders } from './app.routing';
import { ChatComponent } from './components/chat/chat.component';
import { GameListComponent } from './components/game-list/game-list.component';
import { GameComponent } from './components/game/game.component';
import { GameChatComponent } from './components/game-chat/game-chat.component';
import { RerunAnimationDirective } from './directives/rerun-animation.directive';
import { AboutComponent } from './components/about/about.component';
import { DoubleConnectionComponent } from './components/double-connection/double-connection.component';

export function authHttpServiceFactory(http: Http, options: RequestOptions) {
  return new AuthHttp(new AuthConfig(), http, options);
}

@NgModule({
  declarations: [
    AppComponent,
    MainhallComponent,
    NavBarComponent,
    UserProfileComponent,
    ChatComponent,
    GameListComponent,
    GameComponent,
    GameChatComponent,
    RerunAnimationDirective,
    AboutComponent,
    DoubleConnectionComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    routing
  ],
  providers: [
    appRoutesProviders,
    {
      provide: AuthHttp,
      useFactory: authHttpServiceFactory,
      deps: [Http, RequestOptions]
    },
    AuthService,
    GameIdGuard,
    AuthGuard,
    MainChatService,
    GamesService,
    GameplayService,
    SoundService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
