import { Injectable } from '@angular/core';
import { Howl, Howler } from 'howler';

@Injectable()
export class SoundService {
	public soundLibrary:any;
    private soundsReady:boolean;
	public loadingProgress:number;
	private soundsLoaded:number;
	private sounds:Array<any>
	constructor() {
		this.soundLibrary = {}
		this.sounds = [
			{
                volume: 0.4,
				name: 'explosion',
				src: 'assets/sounds/explosion.mp3'
			},
			{
                volume: 0.3,
				name: 'grenade',
				src: 'assets/sounds/grenade.mp3'
			},
            {
                volume: 0.4,
                name: 'click',
                src: 'assets/sounds/click.wav'
            },
            {
                volume: 0.6,
                name: 'lose',
                src: 'assets/sounds/lose.mp3'
            },
            {
                volume: 0.8,
                name: 'win',
                src: 'assets/sounds/win.mp3'
            },
            {
                volume: 0.6,
                name: 'land',
                src: 'assets/sounds/land.mp3'
            },
            {
                volume: 0.6,
                name: 'target',
                src: 'assets/sounds/target.wav'
            }
		]
        this.soundsReady = false
		this.soundsLoaded = 0
		this.loadingProgress = 0
	}

	loadSounds():Promise<any> {
        if (this.soundsReady) {
            return Promise.resolve()
        }
		return Promise.all(this.sounds.map(sound => this.loadSound(sound.name, sound.src, sound.volume))).then(()=>{
                this.soundsReady = true;
                return Promise.resolve()
            })
	}

	private loadSound(name:string, soundUrl:string, volume?:number):Promise<Howl> {
		return new Promise((resolve, reject) => {
			this.soundLibrary[name] = new Howl({
				src: [soundUrl],
                volume: volume || 1.0,
			}).once('load', () => {
				++this.soundsLoaded;
				this.loadingProgress = Math.floor(this.soundsLoaded / this.sounds.length * 100);
				resolve()
			})
		})
	}
}
