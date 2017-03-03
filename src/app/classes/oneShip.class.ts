import { Ship } from './ship.class';

export class OneShip extends Ship {

    constructor(orientation:string) {
        super(1, orientation)
        this.animatedSpriteURLs = 'one_ship_${i}.png' //not template string
        this.deadSpriteURL = 'one_ship_dead.png'
        this.numberOfAnimatedFrames = 5
        this.framesCounterBegining = 1
        this.init()
    }
}
