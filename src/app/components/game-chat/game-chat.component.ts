import {
    Component,
    OnInit
} from '@angular/core';
import { GamesService } from '../../services/games.service';
import { AuthService } from '../../services/auth0.service';
import { MainChatService } from '../../services/main-chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-chat',
  templateUrl: './game-chat.component.html',
  styleUrls: ['./game-chat.component.sass']
})
export class GameChatComponent implements OnInit {
    private connections:Array<any>;
    private messagesBlock:Element;
    private messages:Array<any>;
    private message:string;

    constructor(
        private gameService: GamesService,
        private authService:AuthService,
        private mainChatService:MainChatService,
        private router: Router
    ) {
        this.connections = [];
        this.messages = [];
        if (!this.mainChatService.socket_connected
          && !this.mainChatService.pending_connection) {
          this.mainChatService.enterIoNamespace('game', { key: "game_id", value: this.gameService.gameOn._id });
        }
    }

    ngOnInit() {
        this.messagesBlock = document.querySelector(".messages-block");

        this.connections.push(this.mainChatService.emitter.subscribe(()=>{
            this.subscribeToMessages();
        }))

    }

    ngOnDestroy() {
        this.mainChatService.socket_connected = false;
        this.connections.forEach(connection =>
            connection.unsubscribe()
        );
    }

    subscribeToMessages() {
        this.connections.push(this.mainChatService.getMessages().subscribe((message:any) => {
            if (message.error) {
                console.error(new Error(message.error));
            } else {
            this.formatMessageDate(message);
            this.messages.push(message.data);
            this.scrollBottom();
            }
        }))
    }

    sendMessage() {
        if (this.authService.authenticated()) {
            if (/^\s*\/joke\s*$/g.test(this.message))
            {
                this.mainChatService.emit('joke', {author: this.authService.profile.nickname})
            } else {
                this.mainChatService.sendMessage({text: this.message, author: this.authService.profile.nickname});
            }
        } else {
            this.messages.push({time: "SYSTEM", author: "Error",text: "Please login to start chatting"})
        }
        this.message = '';
    }

    formatMessageDate(message) {
        let date = new Date(message.data.timestap);
        message.data.time = `${date.getHours() > 9 ? date.getHours() : "0" + date.getHours()}:${date.getMinutes() > 9
        ? date.getMinutes() : "0" + date.getMinutes()}:${date.getSeconds() > 9
        ? date.getSeconds() : "0" + date.getSeconds()}`;
    }

    scrollBottom() {
        setTimeout(()=> this.messagesBlock.scrollTop = this.messagesBlock.scrollHeight)
    }

}
