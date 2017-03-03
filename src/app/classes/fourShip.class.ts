import { Ship } from './ship.class';

export class FourShip extends Ship {

    constructor(orientation:string) {
        super(4, orientation)
        this.animatedSpriteURLs = 'four_ship_${i}.png' //not template string
        this.deadSpriteURL = 'four_ship_dead.png'
        this.numberOfAnimatedFrames = 5
        this.framesCounterBegining = 1
        this.init()
    }
}
