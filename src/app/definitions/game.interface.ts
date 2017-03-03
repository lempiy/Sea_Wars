import { GameStats } from "./game-stats.interface";
import { GameEvent } from "./remote-game-event.interface";

interface HostPlayer {
    nickname: string
}

export interface IGame {
    _id: string;
    in_lobby: boolean;
    name: string;
    user_host: HostPlayer;
    user_id: string;
    players: number;
    connected_user_id?: string;
    connected_user_nickname?: string;
    time_stamp: number;
    finished?: boolean;
    loser?: string;
    stats?: GameStats;
    logs?: Array<GameEvent>;
    results?: boolean;
}
