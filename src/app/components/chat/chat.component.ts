import {
    Component,
    OnInit,
    OnDestroy,
    trigger,
    state,
    style,
    transition,
    animate,
    Input
} from '@angular/core';
import { MainChatService } from '../../services/main-chat.service';
import { AuthService } from '../../services/auth0.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.sass'],
  animations: [
    trigger('chatFlyIn', [
        transition('void => *', [
            style({transform: 'translateY(200%)'}),
            animate(800)
        ])
    ])
  ]
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Array<any> = [];
  message: any;
  connections: Array<any>;
  messagesBlock: Element;
  @Input() animateList;

  constructor(private mainChatService: MainChatService, private authService: AuthService) {
    this.connections = [];
    if (!this.mainChatService.socket_connected
      && !this.mainChatService.pending_connection) {
      this.mainChatService.enterIoNamespace('main-hall')
    };
  }

  ngOnInit() {
      this.messagesBlock = document.querySelector(".messages-block");
      this.connections.push(this.mainChatService.emitter.subscribe(data=>{
        this.subscribeToMessages();
        this.subscribeToAmountOfUsers();
      }))
  }

  ngOnDestroy() {
      this.mainChatService.socket_connected = false;
      this.connections.forEach(connection =>
        connection.unsubscribe()
      );
  }

  subscribeToAmountOfUsers() {
      this.connections.push(
          this.mainChatService.onChangeAmountInMainHall().subscribe((data:any) => {
              this.mainChatService.users_in_mainhall = data.amount;
          })
      )
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
        this.mainChatService.sendMessage({text: this.message, author: this.authService.profile.nickname});
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
