export interface GameEvent {
    event: string;
    hit: boolean;
    killed?: boolean;
    killedCells?: Array<any>;
    killedOrientation?: string;
    column: string;
    row: string|number;
    byPlayer?: boolean;
}
export interface RemoteGameEvent {
    player_id: string;
    event?: GameEvent;
    players_turn?: string;
}
