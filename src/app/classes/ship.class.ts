import * as PIXI from 'pixi.js';

export class Ship //for inheritance only
{
    public animatedSprite:PIXI.extras.AnimatedSprite
    public deadSprite:PIXI.Sprite
    public currentSprite:PIXI.Sprite|PIXI.extras.AnimatedSprite
    public currentData:any;
    public orientation:string;
    public length:number;
    public health:number;
    public animatedSpriteURLs:string;
    public numberOfAnimatedFrames:number;
    public framesCounterBegining:number;
    public deadSpriteURL:string;
    public selected:boolean;
    public landed: boolean;
    private _landingCells: Array<string>;
    public isDead:boolean;

    constructor(length, orientation:string) {
        this.length = length
        this.currentSprite = null
        this.deadSprite = null
        this.animatedSprite = null
        this.orientation = orientation
        this.landed = false
        this.currentData = {
            constructionPosition: {
                x: null,
                y: null,
                set: (x:number, y:number) => {
                    this.currentData.constructionPosition.x = x;
                    this.currentData.constructionPosition.y = y;
                }
            },
            position: {
                x: null,
                y: null,
                set: (x:number, y:number) => {
                    this.currentData.position.x = x;
                    this.currentData.position.y = y;
                    this.currentSprite.position.set(x, y)
                }
            },
            anchor: {
                x: null,
                y: null,
                set: (x:number, y:number) => {
                    this.currentData.anchor.x = x;
                    this.currentData.anchor.y = y;
                    this.currentSprite.anchor.set(x, y)
                }
            },
            rotation: null,
            setRotation: (rotationValue:number) => {
                this.currentSprite.rotation = rotationValue
                this.currentData.rotation = rotationValue
            },
            scale: {
                x: null,
                y: null,
                set: (x:number, y:number) => {
                    this.currentData.scale.x = x;
                    this.currentData.scale.y = y || x;
                    this.currentSprite.scale.set(x, y || x)
                }
            }
        }
    }

    init() {
        this.initSprites()
        this.initData()
    }

    initSprites() {
        this.animatedSprite = this.createAnimatedSpite(this.createTextures())
        this.deadSprite = this.createStaticSprite(this.deadSpriteURL)
        this.currentSprite = this.animatedSprite

    }

    initData() {
        this.currentData.position.set(this.currentSprite.position.x, this.currentSprite.position.y)
        this.currentData.anchor.set(this.currentSprite.anchor.x, this.currentSprite.anchor.y)
        this.currentData.setRotation(this.currentSprite.rotation)
        this.currentData.scale.set(this.currentSprite.scale.x, this.currentSprite.scale.y)
        this.health = this.length
        this.changeOrientation(this.orientation)
    }

    setPosition(x:number, y:number, initial?:boolean) {
        if (initial) {
           this.currentData. constructionPosition.set(x, y)
        }
        this.currentData.position.set(x, y)
    }

    setAnimationSpeed(value:number) {
        if (this.currentSprite instanceof PIXI.extras.AnimatedSprite) {
            let animatedSprite = this.currentSprite as PIXI.extras.AnimatedSprite
            animatedSprite.animationSpeed = value
        }
    }

    get landingCells():Array<string> {
        return this._landingCells
    }

    set landingCells(arr:Array<string>) {
        this._landingCells = arr
    }

    signOccupiedCells(arrOfPlacement:any) {
        this.landingCells = arrOfPlacement.map(cell => {
            return `${cell.column}${cell.row}`
        })
    }

    private syncSpritesData(spriteSource:PIXI.Sprite, spriteTarget:PIXI.Sprite) {
        spriteTarget.anchor = spriteSource.anchor
        spriteTarget.position = spriteSource.position
        spriteTarget.rotation = spriteSource.rotation
        spriteTarget.scale = spriteSource.scale
    }

    changeContainer(container:PIXI.Container):void {
        this.currentSprite.parent.removeChild(this.currentSprite);
        container.addChild(this.currentSprite);
    }

    changeOrientation(orientation:string) {
        if (orientation === "horizontal") {
            this.currentData.setRotation(-Math.PI / 2)
            this.orientation = 'horizontal'
        } else if (orientation === "vertical") {
            this.currentData.setRotation(0)
            this.orientation = 'vertical'
        }
    }

    makeStatic():void {
        if (this.currentSprite instanceof PIXI.extras.AnimatedSprite) {
            let animatedSprite = this.currentSprite as PIXI.extras.AnimatedSprite
            animatedSprite.stop()
        }
    }

    makeDead():void {
        var container = this.currentSprite.parent;
        var index = container.getChildIndex(this.currentSprite)
        this.syncSpritesData(this.currentSprite, this.deadSprite)
        container.removeChild(this.currentSprite)
        this.currentSprite = this.deadSprite
        container.addChildAt(this.currentSprite, (index ? index - 1 : 0))
        this.isDead = true
    }

    makeAnimated():void {
        if (this.currentSprite instanceof PIXI.extras.AnimatedSprite) {
            let animatedSprite = this.currentSprite as PIXI.extras.AnimatedSprite
            animatedSprite.animationSpeed = 0.3
            animatedSprite.play()
        }
    }

    createTextures():Array<PIXI.Texture>
    {
        let textures = [],
            i,
            length = this.framesCounterBegining ? this.numberOfAnimatedFrames + this.framesCounterBegining : this.numberOfAnimatedFrames;

        for (i = (this.framesCounterBegining || 0); i < length; i++)
        {
            let texture = PIXI.Texture.fromFrame(this.animatedSpriteURLs.replace(/\${i}/g, i));
            textures.push(texture);
        }
        return textures;
    }

    createSingleTexture(name:string):PIXI.Texture {
        return PIXI.Texture.fromFrame(name);
    }

    createStaticSprite(name:string):PIXI.Sprite {
        let sprite = PIXI.Sprite.fromFrame(name);
        return sprite;
    }

    createAnimatedSpite(arrayOfTextures:Array<PIXI.Texture>):PIXI.extras.AnimatedSprite {
        let animSprite = new PIXI.extras.AnimatedSprite(arrayOfTextures);
        return animSprite;
    }
}
