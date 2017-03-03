import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainhallComponent } from './components/mainhall/mainhall.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { GameComponent } from './components/game/game.component';
import { AboutComponent } from './components/about/about.component';
import { AuthGuard } from './auth.guard';
import { GameIdGuard } from './game-id.guard';

const appRoutes:Routes = [
    {
        path: '',
        component: MainhallComponent
    },
    {
        path: 'profile',
        component: UserProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'game/:id',
        component: GameComponent,
        canActivate: [GameIdGuard, AuthGuard]
    },
    {
        path: 'about',
        component: AboutComponent
    }
]

export const appRoutesProviders: any[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
