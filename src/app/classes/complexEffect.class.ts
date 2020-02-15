import * as PIXI from "pixi.js";
import { Effect } from "./effect.class";

export class ComplexEffect {
    //for inheritance only
    public staticSprite: PIXI.Sprite;
    public animatedSprite: PIXI.extras.AnimatedSprite;
    public staticSpriteURL: string;
    public effect: Effect;
    public container: PIXI.Container;

    constructor(
        staticSpriteName: string,
        effectSpriteNames: string,
        numberOfFrames: number,
        framesCounterBegining?: number
    ) {
        this.staticSpriteURL = staticSpriteName;
        this.staticSprite = PIXI.Sprite.fromFrame(this.staticSpriteURL);
        this.effect = new Effect(
            effectSpriteNames,
            numberOfFrames,
            framesCounterBegining
        );
        this.effect.sprite.loop = true;
        this.container = new PIXI.Container();
        this.maintainContainer();
    }

    show() {
        this.staticSprite.visible = true;
        this.effect.sprite.visible = true;
    }

    hide() {
        this.staticSprite.visible = false;
        this.effect.sprite.visible = false;
    }

    private maintainContainer() {
        this.staticSprite.anchor.set(0.5, 0.5);
        this.staticSprite.position.set(0, 0);
        this.container.addChild(this.staticSprite);

        this.effect.sprite.anchor.set(0.5, 0.5);
        this.effect.sprite.position.set(0, 0);
        this.container.addChild(this.effect.sprite);
    }
}
