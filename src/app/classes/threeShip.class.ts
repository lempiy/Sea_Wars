import { Ship } from './ship.class';

export class ThreeShip extends Ship {

    constructor(orientation:string) {
        super(3, orientation)
        this.animatedSpriteURLs = 'three_ship_${i}.png' //not template string
        this.deadSpriteURL = 'three_ship_dead.png'
        this.numberOfAnimatedFrames = 5
        this.framesCounterBegining = 1
        this.init()
    }
}
