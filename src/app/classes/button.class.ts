import * as PIXI from 'pixi.js';
import { Point } from '../definitions/point.class';
import { EventCallbacks }  from '../definitions/event-callbaks.class';
import { Animatable } from '../definitions/animatable.interface';

export class Button implements Animatable
{
    public sprite:PIXI.Sprite
    public spriteURL:string;
    public size: Object;
    public currentAnimation: string;
    public position: Point;
    private animations: Object;

    constructor(spriteUrl:string, position:Point,  eventCallbacks: EventCallbacks, animations:Object, size?:Object) {
        this.spriteURL = spriteUrl
        this.size = size || {}
        this.sprite = PIXI.Sprite.fromFrame(this.spriteURL)
        this.sprite.pivot.set(this.size['pivot_x'] || Math.ceil(this.sprite.width / 2), this.size['pivot_y'] || Math.ceil(this.sprite.height / 2))
        this.position = position
        this.sprite.position.set(position.x, position.y)
        if (size) {
            this.sprite.width = size['width']
            this.sprite.height = size['height']
        }
        this.animations = animations
        this.attachCallbacks(eventCallbacks)
        this.sprite.visible = false;
        this.sprite.buttonMode = true
    }

    show() {
        this.sprite.visible = true;
    }

    hide() {
        this.sprite.visible = false;
    }

    play():void {
        if (this.currentAnimation) {
            this.animations[this.currentAnimation].call(this.sprite);
        }
    }

    setAnimation(animationKey:string):void {
        this.currentAnimation = animationKey
    }

    private attachCallbacks(eventCallbacks: EventCallbacks):void {
        this.sprite.interactive = true;
        if (eventCallbacks.mouseover) {
            this.sprite.on('mouseover', (event) => eventCallbacks.mouseover(event, this))
        }
        if (eventCallbacks.mouseout) {
            this.sprite.on('mouseout', (event) => eventCallbacks.mouseout(event, this))
        }
        if (eventCallbacks.click) {
            this.sprite.on('click', (event) => eventCallbacks.click(event, this))
            this.sprite.on('tap', (event) => eventCallbacks.click(event, this))
        }
    }
}
