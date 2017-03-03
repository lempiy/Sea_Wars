import * as PIXI from 'pixi.js';

export class Effect //for inheritance only
{
    public sprite:PIXI.extras.AnimatedSprite
    public animatedSpriteURLs:string;
    public numberOfAnimatedFrames:number;
    public framesCounterBegining:number;

    constructor(spriteNames:string, numberOfFrames:number, framesCounterBegining?:number) {
        this.animatedSpriteURLs = spriteNames
        this.numberOfAnimatedFrames = numberOfFrames
        this.framesCounterBegining = framesCounterBegining
        this.sprite = this.createAnimatedSpite(this.createTextures())
    }

    show() {
        this.sprite.visible = true;
    }

    hide() {
        this.sprite.visible = false;
    }

   private createTextures():Array<PIXI.Texture>
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

    createAnimatedSpite(arrayOfTextures:Array<PIXI.Texture>):PIXI.extras.AnimatedSprite {
        let animSprite = new PIXI.extras.AnimatedSprite(arrayOfTextures);
        return animSprite;
    }
}
