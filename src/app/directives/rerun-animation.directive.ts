import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
	selector: '[rerunAnimation]'
})
export class RerunAnimationDirective {

	constructor(private el: ElementRef) {

	}
	@Input('rerunAnimation') rerunAnimation: string;
	@Input('animationShortClass') animationShortClass: string;

	rerun(isShort?:boolean) {
		let element = this.el.nativeElement
		element.classList.remove(this.rerunAnimation, this.animationShortClass)
		void element.clientWidth
		if (isShort && this.animationShortClass) {
			element.classList.add(this.animationShortClass)
		} else {
			element.classList.add(this.rerunAnimation)
		}
	}

}
