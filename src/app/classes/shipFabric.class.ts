import { OneShip } from './oneShip.class';
import { TwoShip } from './twoShip.class';
import { ThreeShip } from './threeShip.class';
import { FourShip } from './fourShip.class';
import { Ship } from './ship.class';
import * as PIXI from 'pixi.js';

export class ShipFabric {
    public ships:any
    public oneShips:Set<Ship>
    public twoShips:Set<Ship>
    public threeShips:Set<Ship>
    public fourShips:Set<Ship>
    public shipTypesSets:Array<any>;
    private defaultNumbersOfShips:any;

    constructor() {
        this.ships = new Set();
        this.oneShips = new Set();
        this.twoShips = new Set();
        this.threeShips = new Set();
        this.fourShips = new Set();
        this.shipTypesSets = [this.oneShips, this.twoShips, this.threeShips, this.fourShips];
        this.defaultNumbersOfShips = {
            one: 4,
            two: 3,
            three: 2,
            four: 1
        }
    }

    createShip(shipLength:number, shipOrientation:string):Ship {
        let ship;
        switch (shipLength) {
            case 1:
                ship = new OneShip(shipOrientation);
                this.ships.add(ship)
                this.oneShips.add(ship)
                return ship;
            case 2:
                ship = new TwoShip(shipOrientation);
                this.ships.add(ship)
                this.twoShips.add(ship)
                return ship;
            case 3:
                ship = new ThreeShip(shipOrientation);
                this.ships.add(ship)
                this.threeShips.add(ship)
                return ship;
            case 4:
                ship = new FourShip(shipOrientation);
                this.ships.add(ship)
                this.fourShips.add(ship)
                return ship;
        }
    }

    createDeadShipSprite(shipLength:number, shipOrientation:string) {
        let shipSprite;
        switch (shipLength) {
            case 1:
                shipSprite = this.createStaticSprite('one_ship_dead.png')
                break
            case 2:
                shipSprite = this.createStaticSprite('two_ship_dead.png')
                break
            case 3:
                shipSprite = this.createStaticSprite('three_ship_dead.png')
                break
            case 4:
                shipSprite = this.createStaticSprite('four_ship_dead.png')
                break
        }
        if (shipOrientation === "horizontal") {
            shipSprite.anchor.set(1, 0)
            shipSprite.rotation = -Math.PI / 2;
        }
        return shipSprite;
    }

    areAllShipsDead():boolean {
        var result = true;
        this.ships.forEach(ship => {
            if (!ship.isDead) {
                result = false;
                return;
            }
        })
        return result;
    }

    private createStaticSprite(name:string):PIXI.Sprite {
        let sprite = PIXI.Sprite.fromFrame(name);
        return sprite;
    }

    createShipsByLength(lengthOfShips:number, amountOfShips:number, shipsOrientation:string):Array<Ship> {
        let result = [],
            i;
        for (i = 0; i < amountOfShips; i++)
        {
            result.push(this.createShip(lengthOfShips, shipsOrientation))
        }

        return result;
    }

    createDefaultStackOfShips(shipsOrientation:string):Array<Ship> {
        let result = [],
            i;
        for (i = 0; i < 4; i++)
        {
            let amount = 4 - i
            result = result.concat(this.createShipsByLength(i + 1, amount, shipsOrientation))
        }

        return result
    }

    clearAllShips(full:boolean):void {
        this.ships.forEach(ship => {
            ship.currentSprite.parent.removeChild(ship.currentSprite)
        })
        if (full) {
            this.ships.clear();
            this.shipTypesSets.forEach(shipSet => {
                shipSet.clear();
            })
        }
    }
}
