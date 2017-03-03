import { Injectable, EventEmitter } from '@angular/core';
import { Grid } from '../classes/grid.class';
import { Tilemap } from '../classes/tilemap.class';
import { ShipFabric } from '../classes/shipFabric.class';
import { Ship } from '../classes/ship.class';
import { Button } from '../classes/button.class';
import { Effect } from '../classes/effect.class';
import { ComplexEffect } from '../classes/complexEffect.class';
import { GameEvent } from '../definitions/remote-game-event.interface';
import { SoundService } from './sound.service';
import * as PIXI from 'pixi.js';

@Injectable()
export class GameplayService {
    public loadingState:number;
    //renderes
    private rendererAlly:PIXI.SystemRenderer;
    private rendererEnemy:PIXI.SystemRenderer;
    //loaders
    private loader:any;
    private res:PIXI.loaders.Loader;
    //absolute container
    private absContainerAlly:PIXI.Container;
    private absContainerEnemy:PIXI.Container;
    //root containers
    private rootContainerAlly:PIXI.Container;
    private rootContainerEnemy:PIXI.Container;
    //background containers
    private backgroundContAlly:PIXI.Container;
    private backgroungContEnemy:PIXI.Container;
    //grid containers
    private gridContainerAlly:PIXI.Container;
    private gridContainerEnemy:PIXI.Container;
    //grid map
    private gridMapAlly:Grid;
    private gridMapEnemy:Grid;

    //controls containers
    private topCtrlsContainerAlly:PIXI.Container;
    private botCtrlsContainerAlly:PIXI.Container;

    private selectShipsContainer:PIXI.Container;

    private topCtrlsContainerEnemy:PIXI.Container;
    private botCtrlsContainerEnemy:PIXI.Container;
    public emitter: EventEmitter<any>;

    //animatable sprites
    private animatable: Array<any>;

    //tiled maps instances
    private shoreMap:Tilemap;
    private shoreMapFlipped:Tilemap;

    //ship manager
    public shipFabric:ShipFabric;

    //game logger
    public gameLogger:Array<any>;

    //game state var for event controls
    public gameState:string

    //landing state vars
    private hoverFigure:PIXI.Sprite;
    private selectedShip:Ship;
    private landingAllowed:boolean;
    public playerLandedShips:boolean;
    public enemyLandedShips:boolean;
    private shipOrientations:Array<string>;


    //battle state vars
    private rotateButton:Button;
    private targetElement:Button;
    private explosionEffectEnemy:Effect;
    private explosionEffectAlly:Effect;
    private actionsAllowed:boolean;
    public playersTurn:boolean;


    constructor(private soundService: SoundService) {
        this.emitter = new EventEmitter;
        this.loadingState = 0;
        this.shipOrientations = [
            "vertical",
            "horizontal"
        ]
    }

    init():Promise<any> {
        this.rendererAlly = PIXI.autoDetectRenderer(320, 576, { antialias: true, backgroundColor: 0x003454 });
        this.rendererEnemy = PIXI.autoDetectRenderer(320, 576, { antialias: true, backgroundColor: 0x003454 });
        document.querySelector(".ally").appendChild(this.rendererAlly.view);
        document.querySelector(".enemy").appendChild(this.rendererEnemy.view);
        this.gameLogger = [];

        this.absContainerAlly = new PIXI.Container();

        this.rootContainerAlly = new PIXI.Container();
        this.rootContainerAlly.position.set(0, 128);
        this.rootContainerAlly.width = 320;
        this.rootContainerAlly.height = 320;

        this.topCtrlsContainerAlly = new PIXI.Container();
        this.botCtrlsContainerAlly = new PIXI.Container();
        this.botCtrlsContainerAlly.position.set(0, 448);

        this.absContainerAlly.addChild(this.topCtrlsContainerAlly);
        this.absContainerAlly.addChild(this.botCtrlsContainerAlly);
        this.absContainerAlly.addChild(this.rootContainerAlly);


        this.absContainerEnemy = new PIXI.Container();

        this.rootContainerEnemy = new PIXI.Container();
        this.rootContainerEnemy.position.set(0, 128);
        this.rootContainerEnemy.width = 320;
        this.rootContainerEnemy.height = 320;

        this.topCtrlsContainerEnemy = new PIXI.Container();
        this.botCtrlsContainerEnemy = new PIXI.Container();
        this.botCtrlsContainerEnemy.position.set(0, 448);

        this.absContainerEnemy.addChild(this.topCtrlsContainerEnemy);
        this.absContainerEnemy.addChild(this.botCtrlsContainerEnemy);
        this.absContainerEnemy.addChild(this.rootContainerEnemy);

        this.animatable = [];
        this.gameState = '';
        this.enemyLandedShips = false;
        this.playerLandedShips = false;

        let self = this;

        function runGame (res?:PIXI.loaders.Loader, loader?:any){
            self.res = self.res || res;
            self.loader = self.loader || loader;
            self.shipFabric = new ShipFabric();
            self.shoreMap = new Tilemap(self.res.resources['shoremap'].data);
            self.shoreMapFlipped = new Tilemap(self.res.resources['shoremapflipped'].data);
            self.run.call(self, self.res, self.loader);
        }

        if (self.res && self.loader) {
            return Promise.resolve(runGame());
        }
        return new Promise((resolve, reject) => {
            PIXI.loader
                .add('captain', '/assets/sheets/captain/captain.png')
                .add('shoremaptiled', '/assets/sheets/tile_shore/gallery-metal-tile-kit-02.png')
                .add('shoremap', '/assets/sheets/tile_shore/tile_shore.json')
                .add('shoremapflipped', '/assets/sheets/tile_shore/tile_shore_flipped.json')
                .add('seaatlas', '/assets/sheets/sea_atlas/sea_atlas.json')
                .add('shipssheet', '/assets/sheets/ships/ships_sheet.png')
                .add('shipsatlas', '/assets/sheets/ships/ships_atlas.json')
                .add('ui_sheet', '/assets/sheets/effects/effects_spritesheet.png')
                .add('ui_atlas', '/assets/sheets/effects/effects.json')
                .load(
                    function(res, loader){
                        runGame(res, loader)
                        resolve()
                    }
                )
                .on('progress', loader => {
                    self.loadingState = Math.floor(loader.progress)
                })
        })
    }

    private animate() {
        let self = this;

        self.rendererAlly.render(self.absContainerAlly);
        self.rendererEnemy.render(self.absContainerEnemy);

        let i;
        for (i = 0; i < self.animatable.length; i++)
        {
            self.animatable[i].play()
        }

        requestAnimationFrame(function(){
            self.animate.call(self)
        });
    }

    private run() {
        this.drawBackground()
        this.drawGrid()
        this.drawCtrls()
        // this.drawShip()
        // this.addSeletionShips()
        // this.gameState = 'landing'
        this.animate()
    }

    drawBackground() {
        let waterTextures = this.createTexture("frame_${i}_delay-0.1s.gif", 19);

        this.backgroundContAlly = new PIXI.Container();
        this.backgroungContEnemy = new PIXI.Container();

        this.backgroundContAlly.addChild(this.createSeaBackground(waterTextures));
        this.rootContainerAlly.addChildAt(this.backgroundContAlly, 0);

        this.backgroungContEnemy.addChild(this.createSeaBackground(waterTextures));
        this.rootContainerEnemy.addChildAt(this.backgroungContEnemy, 0);
    }

    drawGrid() {
        this.createGrid(10);

        this.rootContainerAlly.addChild(this.gridContainerAlly);
        this.rootContainerAlly.setChildIndex(this.gridContainerAlly, 1);

        this.rootContainerEnemy.addChild(this.gridContainerEnemy);
        this.rootContainerEnemy.setChildIndex(this.gridContainerEnemy, 1);
    }

    drawCtrls() {
        let topCntrlsAlly = this.createTilingSprite('shoremaptiled', this.shoreMapFlipped.getMapData());
        topCntrlsAlly.position.set(0, 0)
        let bottomCntrAlly = this.createTilingSprite('shoremaptiled', this.shoreMap.getMapData());
        this.topCtrlsContainerAlly.addChild(topCntrlsAlly);
        this.botCtrlsContainerAlly.addChild(bottomCntrAlly);

        let topCntrlsEnemy = this.createTilingSprite('shoremaptiled', this.shoreMapFlipped.getMapData());
        topCntrlsEnemy.position.set(0, 0)
        let bottomCntrEnemy = this.createTilingSprite('shoremaptiled', this.shoreMap.getMapData());
        this.topCtrlsContainerEnemy.addChild(topCntrlsEnemy);
        this.botCtrlsContainerEnemy.addChild(bottomCntrEnemy);
        this.rotateButton = this.createButtonRotate();
        this.animatable.push(this.rotateButton);

        this.topCtrlsContainerAlly.addChild(this.rotateButton.sprite);
    }

    private createTexture(names:string, numOfFrames:number, begin?:number):Array<PIXI.Texture>
    {
        let textures = [],
            i,
            length = begin ? numOfFrames + begin : numOfFrames;

        for (i = (begin || 0); i < length; i++)
        {
            let texture = PIXI.Texture.fromFrame(names.replace(/\${i}/g, i));
            textures.push(texture);
        }
        return textures;
    }

    private createSingleTexture(name:string) {
        return PIXI.Texture.fromFrame(name);
    }

    private createTilingSprite(url:string, dataArray:Array<any[]>){
        let baseTexture = PIXI.BaseTexture.fromImage(url);
        let resultContainer = new PIXI.Container();
        for (let i = 0; i < dataArray.length; i++)
        {
            for (let j = 0; j < dataArray[i].length; j++)
            {
                let packet = dataArray[i][j];
                let texture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(packet.px, packet.py, packet.width, packet.height));
                let sprite = new PIXI.Sprite(texture);
                sprite.position.set(packet.worldX, packet.worldY);
                resultContainer.addChild(sprite);
            }
        }
        return resultContainer;
    }

    private createSeaBackground (waterTextures):PIXI.extras.AnimatedSprite {
        var movie = this.createAnimatedSpite(waterTextures);
        movie.position.x = 0;
        movie.position.y = 0;
        movie.scale.set(1);
        movie.animationSpeed = 0.4;
        movie.play();

        return movie;
    }

    private drawPreview(arrOfGraph:any, isCorrectLanding:boolean) {
        if (isCorrectLanding) {
            this.hoverFigure.tint = 0x00ff00;
            this.landingAllowed = true;
        } else {
            this.hoverFigure.tint = 0xff0000;
            this.landingAllowed = false;
        }
        if (!this.hoverFigure.parent) {
            this.gridContainerAlly.addChildAt(this.hoverFigure, 0);
        }
        this.hoverFigure.position.set(arrOfGraph[0].x, arrOfGraph[0].y);
    }

    private landShip(targetCell:any, arrOfPlacement:any, arrOfTouched:any) {
        this.selectedShip.currentSprite.parent.removeChild(this.selectedShip.currentSprite);
        this.gridContainerAlly.addChildAt(this.selectedShip.currentSprite, 0);
        arrOfPlacement.map(cell => {
            cell.occupied = this.selectedShip;
        })
        arrOfTouched.map(cell => {
            cell.touched = true;
        })
        var landingCell, x, y;
        if (this.selectedShip.orientation === 'vertical') {
                landingCell = this.gridMapAlly.getKey(arrOfPlacement[0]);
                x = landingCell.x + this.selectedShip.currentSprite.width * this.selectedShip.currentSprite.anchor.x;
                y = landingCell.y + this.selectedShip.currentSprite.height * this.selectedShip.currentSprite.anchor.y;
        } else {
                landingCell = this.gridMapAlly.getKey(arrOfPlacement[0]);
                x = landingCell.x + this.selectedShip.currentSprite.height * this.selectedShip.currentSprite.anchor.y;
                y = landingCell.y + this.selectedShip.currentSprite.width * this.selectedShip.currentSprite.anchor.x;
        }
        this.selectedShip.currentData.position.set(x, y);
        this.selectedShip.landed = true;
        this.selectedShip.signOccupiedCells(arrOfPlacement);
        this.selectedShip.makeAnimated();
        this.selectedShip = null;
        this.soundService.soundLibrary.land.play()
        this.rotateButton.hide();
        if (this.isAllLanded()) {
            this.emitter.emit({event: "ships-landed"})
        }
    }

    private getRandomPlacement(shipLength:number, shipRandomOrientation:string) {
        //debugger;
        let placementVariations:Array<any>;
        if (shipRandomOrientation === "vertical")
        {
            placementVariations = this.getFreeSlotsListVertical(shipLength)
        } else
        {
            placementVariations = this.getFreeSlotsListHorizonal(shipLength)
        }
        return placementVariations;
    }

    private getFreeSlotsListHorizonal(slotSize:number) {
        let result = [];
        for(let i = 65; i < 65 + this.gridMapAlly.square - slotSize + 1; i++)
        {
            let column = String.fromCharCode(i);
            for(let j = 1; j < 1 + this.gridMapAlly.square; j++)
            {
                let row = j
                let candidateKey = this.gridMapAlly.getByString(column, row);
                let candidate = this.gridMapAlly.get(candidateKey);
                let cells = this.gridMapAlly.getSiblingsRight(candidateKey,  slotSize - 1);
                cells.unshift(candidate);
                let touchedCells = this.gridMapAlly.getTouchedCells(cells, 'horizontal', false, true);
                let cellsFree = cells.every(cell => !cell.occupied && !cell.touched);
                let touchedCellsFree = touchedCells.every(cell => !cell.occupied);
                if (cellsFree && touchedCellsFree)
                {
                    result.push({
                        "cells": cells,
                        "touchedCells": touchedCells
                    })
                }
            }
        }
        return result;
    }

    private getFreeSlotsListVertical(slotSize:number) {
        let result = [];
        for(let i = 1; i < 1 + this.gridMapAlly.square - slotSize + 1; i++)
        {
            let row = i;
            for(let j = 65; j < 65 + this.gridMapAlly.square; j++)
            {
                let column = String.fromCharCode(j);
                let candidateKey = this.gridMapAlly.getByString(column, row);
                let candidate = this.gridMapAlly.get(candidateKey);
                let cells = this.gridMapAlly.getSiblingsBottom(candidateKey, slotSize - 1);
                cells.unshift(candidate);
                let touchedCells = this.gridMapAlly.getTouchedCells(cells, 'vertical', false, true);
                let cellsFree = cells.every(cell => !cell.occupied && !cell.touched);
                let touchedCellsFree = touchedCells.every(cell => !cell.occupied);
                if (cellsFree && touchedCellsFree)
                {
                    result.push({
                        "cells": cells,
                        "touchedCells": touchedCells
                    })
                }
            }
        }
        return result;
    }

    public beginBattleStage(playersTurn:boolean) {
        this.gameState = 'battling'
        this.gridContainerAlly.buttonMode = false
        this.gridContainerEnemy.buttonMode = true
        this.playersTurn = playersTurn

        this.targetElement = this.createTarget()
        this.targetElement.hide()
        this.gridContainerEnemy.addChild(this.targetElement.sprite)
        this.animatable.push(this.targetElement);

        this.explosionEffectEnemy = this.createExplosion()
        this.gridContainerEnemy.addChild(this.explosionEffectEnemy.sprite)

        this.explosionEffectAlly = this.createExplosion()
        this.gridContainerAlly.addChild(this.explosionEffectAlly.sprite)

        this.actionsAllowed = true;
    }

    public beginLandingStage() {
        this.addSeletionShips()
        this.gameState = 'landing'
    }

    public randomLanding() {
        if (this.gameState === 'landing')
        this.shipFabric.ships.forEach(ship => {
            if (!ship.landed) {
                let shipRandomOrientation = this.shipOrientations[Math.round(Math.random())];
                let variations = this.getRandomPlacement(ship.length, shipRandomOrientation);
                let randomPlace = variations[this.getRandomInt(0, variations.length - 1)];
                this.selectedShip = ship;
                this.selectedShip.changeOrientation(shipRandomOrientation);
                this.landShip(randomPlace.cells[0], randomPlace.cells, randomPlace.touchedCells)
            }
        })
    }

    private isAllLanded():boolean {
        var result = true;
        this.shipFabric.ships.forEach(ship => {
            if (!ship.landed) {
                result = false;
                return;
            }
        })
        return result;
    }

    private rotateSelectedShip() {
        if (this.selectedShip.orientation === 'vertical') {
            this.hoverFigure.anchor.set(1, 0)
            this.hoverFigure.rotation = -Math.PI / 2;
            this.selectedShip.changeOrientation('horizontal');
        } else {
            this.hoverFigure.anchor.set(0, 0)
            this.hoverFigure.rotation = 0;
            this.selectedShip.changeOrientation('vertical');
        }
        this.soundService.soundLibrary.click.play();
    }

    private createButtonRotate():Button {
        let self = this;
        return new Button(
            'rotate.png',
            {
                x: Math.floor(this.topCtrlsContainerAlly.width / 5 * 4),
                y: Math.floor(this.topCtrlsContainerAlly.height / 2),
            },
            {
                click: function(event, button:Button) {
                    self.rotateSelectedShip()
                },
                mouseover: function(event, button:Button) {
                    button.setAnimation('spin');
                },
                mouseout: function(event, button:Button) {
                    button.setAnimation('');
                    button.sprite.rotation = 0
                },
            },
            {
                spin: function() { this.rotation += -0.1 }
            },
            {
                width: 50,
                height: 50,
                pivot_x: 27,
                pivot_y: 26
            })
    }

    private createTarget():Button {
         let target = new Button(
            'target.png',
            {
                x: 0,
                y: 0,
            },
            {},
            {
                popin: function() {
                    if (this.scale.x < 0.9) {
                        this.scale.set(this.scale.x + 0.2)
                    } else {
                        target.setAnimation('')
                    }
                },
                popout: function() {
                    if (this.scale.x >= 0.1) {
                        this.scale.set(this.scale.x - 0.2)
                    } else {
                        target.setAnimation('')
                    }
                }
            })
            return target
    }

    private createMissSign():Button {
         let missSign = new Button(
            'miss.png',
            {
                x: 0,
                y: 0,
            },
            {},
            {
                popin: function() {
                    if (this.scale.x < 0.9) {
                        this.scale.set(this.scale.x + 0.2)
                    } else {
                        missSign.setAnimation('')
                    }
                },
                popout: function() {
                    if (this.scale.x >= 0.1) {
                        this.scale.set(this.scale.x - 0.2)
                    } else {
                        missSign.setAnimation('')
                    }
                }
            })
            return missSign
    }

    private createPlayerBuriningSpot() {
        let effect = new Effect ('burn_${i}.png', 32, 1)
        effect.sprite.anchor.set(0.5, 0.5)
        return effect
    }

    private createExplosion() {
        let effect = new Effect ('explosion_${i}.png', 32, 1)
        effect.hide()
        effect.sprite.loop = false
        effect.sprite.anchor.set(0.5, 0.5)
        effect.sprite.onComplete = function () {
            effect.hide()
        }
        return effect
    }

    private createEnemyBurningSpot() {
        let burningSpot = new ComplexEffect(
            "spot.png",
            "burn_${i}.png",
            32,
            1
        )
        return burningSpot
    }

    onEnemyFired(targetData:GameEvent) {
        let targetCellGraphic = this.gridMapAlly.getByString(targetData.column, targetData.row);
        let targetCell = this.gridMapAlly.get(targetCellGraphic)
        if (targetCell.occupied) {
            let hittenShip:Ship = targetCell.occupied;
            if (hittenShip.health) {
                --hittenShip.health
                this.emitter.emit({
                    event: "fire-result",
                    hit: true,
                    killed: !hittenShip.health,
                    killedCells: hittenShip.landingCells,
                    killedOrientation: hittenShip.orientation,
                    column: targetData.column,
                    row: targetData.row
                })
            }
        } else {
            this.emitter.emit({
                event: "fire-result",
                hit: false,
                column: targetData.column,
                row: targetData.row
            })
        }
    }

    // BEGIN PLAYER FIRE RESULTS
    onPlayerFireResults(data:GameEvent) {
        let targetCellGraphic = this.gridMapEnemy.getByString(data.column, data.row);
        let targetCell = this.gridMapEnemy.get(targetCellGraphic)
        this.explosionEffectEnemy.sprite.position.set(
            Math.floor(targetCellGraphic.x + targetCellGraphic.width / 2),
            Math.floor(targetCellGraphic.y + targetCellGraphic.height / 2)
        )
        data.byPlayer = true
        this.gameLogger.push(data)
        this.explosionEffectEnemy.show()
        this.explosionEffectEnemy.sprite.gotoAndPlay(0)
        this.targetElement.hide()
        if (data.hit) {
            if (data.killed) {
                this.onPlayerKill(targetCellGraphic, targetCell, data.killedCells, data.killedOrientation);
                this.soundService.soundLibrary.grenade.play();
            } else {
                this.onPlayerHit(targetCellGraphic, targetCell);
                this.soundService.soundLibrary.explosion.play();
            }
        } else {
            this.onPlayerMissed(targetCellGraphic, targetCell);
            this.soundService.soundLibrary.explosion.play();
        }
    }

    private onPlayerMissed(targetCellGraphic:PIXI.Graphics, targetCell:any) {
        let sign = this.createMissSign()
        sign.sprite.visible = false
        this.gridContainerEnemy.addChild(sign.sprite)
        this.gridContainerEnemy.setChildIndex(this.explosionEffectEnemy.sprite, this.gridContainerEnemy.children.length - 1)
        this.explosionEffectEnemy.sprite.onFrameChange = () => {
            if (!sign.sprite.visible && this.explosionEffectEnemy.sprite.currentFrame > 12) {
                sign.sprite.position.set(
                    targetCellGraphic.x + targetCellGraphic.width * 0.5,
                    targetCellGraphic.y +  targetCellGraphic.height * 0.5
                )
                targetCell.effect = sign
                sign.sprite.visible = true
                this.actionsAllowed = true
                this.playersTurn = false
            }
        }
        this.explosionEffectEnemy.sprite.onComplete = () => {
            this.explosionEffectEnemy.hide()
        }
    }

    private onPlayerKill(targetCellGraphic:PIXI.Graphics, targetCell:any, killedCells:any, killedOrientation:string) {
        let i;
        let deadShip:PIXI.Sprite = this.shipFabric.createDeadShipSprite(killedCells.length, killedOrientation)
        for (i = 0; i < killedCells.length; i++) {
            let cellCoords = killedCells[i]
            let coords = [cellCoords[0], cellCoords.slice(1)]
            let cellGraphic:PIXI.Graphics = this.gridMapEnemy.getByString(coords[0], coords[1])
            let cell = this.gridMapEnemy.get(cellGraphic)

            if (!i) {
                deadShip.visible = false
                deadShip.position.set(
                    cellGraphic.position.x,
                    cellGraphic.position.y
                )
                this.gridContainerEnemy.addChild(deadShip)
            }

            let explosion = this.createExplosion()
            explosion.sprite.scale.set(0.7)
            explosion.sprite.position.set(
                cellGraphic.position.x + cellGraphic.width * 0.5,
                cellGraphic.position.y + cellGraphic.height * 0.5
            )
            this.gridContainerEnemy.addChild(explosion.sprite)

            explosion.sprite.onFrameChange = () => {
                if (cell.effect && explosion.sprite.currentFrame > 12) {
                    cell.effect.container.parent.removeChild(cell.effect.container)
                    deadShip.visible = true
                    cell.effect = null
                    this.actionsAllowed = true
                }
                if (killedCells.length === 1 && explosion.sprite.currentFrame > 12) {
                    deadShip.visible = true
                    this.actionsAllowed = true
                }
            }

            explosion.show()
            explosion.sprite.play()
        }
    }

    private onPlayerHit(targetCellGraphic:PIXI.Graphics, targetCell:any) {
        let spot = this.createEnemyBurningSpot()
        spot.container.visible = false
        this.gridContainerEnemy.addChild(spot.container)
        this.gridContainerEnemy.setChildIndex(this.explosionEffectEnemy.sprite, this.gridContainerEnemy.children.length - 1)
        this.explosionEffectEnemy.sprite.onFrameChange = () => {
            if (!spot.container.visible && this.explosionEffectEnemy.sprite.currentFrame > 12) {
                spot.container.position.set(
                    targetCellGraphic.x + targetCellGraphic.width * 0.5,
                    targetCellGraphic.y +  targetCellGraphic.height * 0.5
                )
                targetCell.effect = spot
                spot.effect.sprite.position.set(0, -Math.floor(spot.effect.sprite.height * 0.3))
                spot.container.visible = true
                spot.effect.sprite.play()
                this.actionsAllowed = true
            }
        }
        this.explosionEffectEnemy.sprite.onComplete = () => {
            this.explosionEffectEnemy.hide()
        }
    }
    // END PLAYER FIRE RESULTS

    // BEGIN ENEMY FIRE RESULTS
    onEnemyFireResults(data:GameEvent) {
        let targetCellGraphic = this.gridMapAlly.getByString(data.column, data.row);
        let targetCell = this.gridMapAlly.get(targetCellGraphic)
        this.explosionEffectAlly.sprite.position.set(
            Math.floor(targetCellGraphic.x + targetCellGraphic.width / 2),
            Math.floor(targetCellGraphic.y + targetCellGraphic.height / 2)
        )
        this.gameLogger.push(data)
        this.explosionEffectAlly.show()
        this.explosionEffectAlly.sprite.gotoAndPlay(0)
        this.targetElement.hide()
        if (data.hit) {
            if (data.killed) {
                this.onEnemyKill(targetCellGraphic, targetCell, data.killedCells, data.killedOrientation);
                this.soundService.soundLibrary.grenade.play();
            } else {
                this.onEnemyHit(targetCellGraphic, targetCell);
                this.soundService.soundLibrary.explosion.play();
            }
        } else {
            this.onEnemyMissed(targetCellGraphic, targetCell);
            this.soundService.soundLibrary.explosion.play();
        }
    }

    private onEnemyMissed(targetCellGraphic:PIXI.Graphics, targetCell:any) {
        let sign = this.createMissSign()
        sign.sprite.visible = false
        this.gridContainerAlly.addChild(sign.sprite)
        this.gridContainerAlly.setChildIndex(this.explosionEffectAlly.sprite, this.gridContainerAlly.children.length - 1)
        this.explosionEffectAlly.sprite.onFrameChange = () => {
            if (!sign.sprite.visible && this.explosionEffectAlly.sprite.currentFrame > 12) {
                sign.sprite.position.set(
                    targetCellGraphic.x + targetCellGraphic.width * 0.5,
                    targetCellGraphic.y +  targetCellGraphic.height * 0.5
                )
                targetCell.effect = sign
                sign.sprite.visible = true
                this.playersTurn = true
            }
        }
        this.explosionEffectAlly.sprite.onComplete = () => {
            this.explosionEffectAlly.hide()
        }
    }

    private onEnemyKill(targetCellGraphic:PIXI.Graphics, targetCell:any, killedCells:any, killedOrientation:string) {
        let i;
        let deadShip:PIXI.Sprite = this.shipFabric.createDeadShipSprite(killedCells.length, killedOrientation)
        for (i = 0; i < killedCells.length; i++) {
            let cellCoords = killedCells[i]
            let coords = [cellCoords[0], cellCoords.slice(1)]
            let cellGraphic:PIXI.Graphics = this.gridMapAlly.getByString(coords[0], coords[1])
            let cell = this.gridMapAlly.get(cellGraphic)

            let explosion = this.createExplosion()
            explosion.sprite.scale.set(0.7)
            explosion.sprite.position.set(
                cellGraphic.position.x + cellGraphic.width * 0.5,
                cellGraphic.position.y + cellGraphic.height * 0.5
            )
            this.gridContainerAlly.addChild(explosion.sprite)
            let triggered = false
            explosion.sprite.onFrameChange = () => {
                if (!triggered  && explosion.sprite.currentFrame > 12) {
                     if (cell.effect) {
                        cell.effect.container.parent.removeChild(cell.effect.container)
                        cell.effect = null
                    }
                    if (i === killedCells.length) {
                        cell.occupied.makeDead()
                        if (this.shipFabric.areAllShipsDead()) {
                            this.emitter.emit({event: "lost"})
                        }
                        triggered = true
                    }
                }
            }

            explosion.show()
            explosion.sprite.play()
        }
    }

    private onEnemyHit(targetCellGraphic:PIXI.Graphics, targetCell:any) {
        let spot = this.createEnemyBurningSpot()
        spot.container.visible = false
        spot.container.scale.set(0.7)
        this.gridContainerAlly.addChild(spot.container)
        this.gridContainerAlly.setChildIndex(this.explosionEffectAlly.sprite, this.gridContainerAlly.children.length - 1)
        this.explosionEffectAlly.sprite.onFrameChange = () => {
            if (!spot.container.visible && this.explosionEffectAlly.sprite.currentFrame > 12) {
                spot.container.position.set(
                    targetCellGraphic.x + targetCellGraphic.width * 0.5,
                    targetCellGraphic.y +  targetCellGraphic.height * 0.5
                )
                targetCell.effect = spot
                spot.effect.sprite.position.set(0, -Math.floor(spot.effect.sprite.height * 0.3))
                spot.container.visible = true
                spot.effect.sprite.play()
            }
        }
        this.explosionEffectAlly.sprite.onComplete = () => {
            this.explosionEffectAlly.hide()
        }
    }

    // END ENEMY FIRE RESULTS

    private createGrid(size:number) {

        this.gridContainerAlly = new PIXI.Container();
        this.gridContainerEnemy = new PIXI.Container();

        this.gridMapAlly = new Grid(10);
        this.gridMapEnemy = new Grid(10);


        let width = this.rootContainerAlly.width / size;
        let height = this.rootContainerAlly.height / size;
        let self = this;

        let createCell = (x:number, y:number, width:number, height:number, isEnemy?:boolean) => {

            let cell = new PIXI.Graphics();
                cell.interactive = true;
                cell.position.set(x, y);
                cell.lineStyle(2, 0x333333, 0.1)
                    .drawRect(0, 0, width, height);
                    //events on grid
                if (isEnemy) {
                    cell
                        .on('click', function(event) { self.onEnemyGridCellClick(event, this)})
                        .on('tap', function(event) { self.onEnemyGridCellClick(event, this)})
                        .on('mouseover', function(event) { self.onEnemyGridCellMouseEnter(event, this)})
                    // .on('mouseout', function(event) { self.onGridCellMouseLeave(event, this)})
                } else {
                    cell
                        .on('click', function(event) { self.onGridCellClick(event, this)})
                        .on('tap', function(event) { self.onGridCellClick(event, this)})
                        .on('mouseover', function(event) { self.onGridCellMouseEnter(event, this)})
                    // .on('mouseout', function(event) { self.onGridCellMouseLeave(event, this)})
                }

                cell.hitArea = new PIXI.Rectangle(0, 0, width, height);

                return cell;
        }

        var i,
            j,
            aCell,
            eCell;
        for (i = 0; i < size; i++) // for each column
        {
            for (j = 0; j < size; j++) // for each row
            {
                aCell = createCell(i * width, j * height, width, height);
                this.gridMapAlly.set(aCell,
                    {
                        is_ally: true,
                        is_enemy: false,
                        column: String.fromCharCode(65 + i),
                        row: j + 1,
                        occupied: false,
                        touched: false,
                        effect: false
                    })
                this.gridContainerAlly.addChild(aCell);

                eCell = createCell(i * width, j * height, width, height, true);
                this.gridMapEnemy.set(eCell,
                    {
                        is_ally: false,
                        is_enemy: true,
                        column: String.fromCharCode(65 + i),
                        row: j + 1,
                        occupied: false,
                        touched: false,
                        effect: false,
                        hitten: false
                    })
                this.gridContainerEnemy.addChild(eCell);
            }
        }
        this.gridContainerAlly.interactive = true;
        this.gridContainerAlly
            .on('mouseout', function(event) { self.onGridCellMouseLeave(event, this)})
    }

    addSeletionShips() {
        this.selectShipsContainer = new PIXI.Container;
        let self = this;
        let totalWidth = this.rendererAlly.view.width;
        let stackOfShips = this.shipFabric.createDefaultStackOfShips('vertical');
        let i;
        for(i = 0; i < stackOfShips.length; i++)
        {
            let ship = stackOfShips[i]
            ship.currentData.anchor.set(0.5, 0.5)
            ship.setPosition(totalWidth / stackOfShips.length * i + (ship.currentSprite.width / 2), 64, true);
            ship.currentSprite.interactive = true;
            ship.currentSprite
                .on('click', (event) => onShipClick(event, ship))
            this.selectShipsContainer.addChild(ship.currentSprite);
        }
        this.botCtrlsContainerAlly.addChild(this.selectShipsContainer)
        function onShipClick(event, ship) {
            selectShip(ship);
        }

        let selectShip = (ship:Ship) => {
            if (this.selectedShip) {
                this.selectedShip.currentSprite.parent.removeChild(this.selectedShip.currentSprite)
                this.selectedShip.currentData.position.set(
                    this.selectedShip.currentData.constructionPosition.x,
                    this.selectedShip.currentData.constructionPosition.y
                )
                this.selectShipsContainer.addChild(this.selectedShip.currentSprite)
                this.selectedShip.selected = false
            }
            ship.selected = true
            this.selectedShip = ship
            ship.currentSprite.parent.removeChild(ship.currentSprite)
            ship.currentData.position.set(this.topCtrlsContainerAlly.width / 2, this.topCtrlsContainerAlly.height / 2)
            this.topCtrlsContainerAlly.addChild(ship.currentSprite)
            this.hoverFigure = new PIXI.Sprite(this.selectedShip.currentSprite.texture.clone())
            this.hoverFigure.alpha = 0.5;
            this.rotateButton.show();
            this.soundService.soundLibrary.click.play();
        }
    }

    createAnimatedSpite(arrayOfTextures:Array<PIXI.Texture>):PIXI.extras.AnimatedSprite {
        return new PIXI.extras.AnimatedSprite(arrayOfTextures);
    }

    /** BEGIN EVENTS **/

    onGridCellClick(event, target) {
        if (this.selectedShip && this.landingAllowed) {
            this.gridContainerAlly.removeChild(this.hoverFigure);
            this.hoverFigure = null;
            let arr;
            if (this.selectedShip.orientation === 'vertical') {
                arr = this.gridMapAlly.getCentredVerticSlice(target, this.selectedShip.length)
            } else {
                arr = this.gridMapAlly.getCentredHorizontalSlice(target, this.selectedShip.length)
            }
            this.landShip(target, arr, this.gridMapAlly.getTouchedCells(arr, this.selectedShip.orientation, false, true));
        }
    }

    onGridCellMouseEnter(event, target) {
        if (this.selectedShip) {
            this.gridContainerAlly.removeChild(this.hoverFigure);
            let arr;
            if (this.selectedShip.orientation === 'vertical') {
                arr = this.gridMapAlly.getCentredVerticSlice(target, this.selectedShip.length, true)
            } else {
                arr = this.gridMapAlly.getCentredHorizontalSlice(target, this.selectedShip.length, true)
            }
            this.drawPreview(arr, this.gridMapAlly.checkTouchedCells(arr, this.selectedShip.orientation));
        }
    }

    onGridCellMouseLeave(event, target) {
        if (this.hoverFigure && this.hoverFigure.parent) {
            this.hoverFigure.parent.removeChild(this.hoverFigure);
            this.landingAllowed = false;
        }
    }

    onEnemyGridCellClick(event, target) {
        if (this.gameState === "battling" && this.actionsAllowed && this.playersTurn) {
            let targetCell = this.gridMapEnemy.get(target)
            if (targetCell.hitten) return;
            targetCell.hitten = true;
            this.actionsAllowed = false;
            this.targetElement.sprite.position.set(target.x + target.width * 0.5, target.y + target.height * 0.5)
            this.targetElement.show()
            this.targetElement.sprite.scale.set(0)
            this.targetElement.setAnimation('popin');
            this.soundService.soundLibrary.target.play()
            this.emitter.emit({event: "fire", column: targetCell.column, row: targetCell.row})
        }
    }

    onEnemyGridCellMouseEnter(event, target) {
        if (this.gameState === "battling") {
        }
    }

    onEnemyGridCellMouseLeave(event, target) {
        if (this.gameState === "battling") {

        }
    }

    /** END EVENTS **/
    onEnemyWin(data) {
        this.gameState = "lose"
        this.soundService.soundLibrary.lose.play()
    }

    onPlayerWin(data) {
        this.gameState = "win"
        this.soundService.soundLibrary.win.play()
    }

    private getRandomInt(min:number, max:number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
