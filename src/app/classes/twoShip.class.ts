import { Ship } from './ship.class';

export class TwoShip extends Ship {

    constructor(orientation:string) {
        super(2, orientation)
        this.animatedSpriteURLs = 'two_ship_${i}.png' //not template string
        this.deadSpriteURL = 'two_ship_dead.png'
        this.numberOfAnimatedFrames = 5
        this.framesCounterBegining = 1
        this.init()
    }
}
