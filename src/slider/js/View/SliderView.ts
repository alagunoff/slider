import EventEmitter from '../EventEmitter/EventEmitter';
import IParameters from '../Interfaces/IParameters';

// @ts-ignore
import sliderTemplateHbs from '../../sliderTemplate.hbs';

export default class SliderView extends EventEmitter {
  private anchorElement: HTMLElement;
  private slider: HTMLSpanElement;
  private runnerFrom: HTMLSpanElement;
  private tipFrom?: HTMLSpanElement;
  private bar: HTMLSpanElement;
  private runnerTo?: HTMLSpanElement;
  private tipTo?: HTMLSpanElement;
  private scale: HTMLSpanElement;

  constructor(anchorElement: HTMLElement, parameters: IParameters) {
    super();

    this.anchorElement = anchorElement;

    this.init(parameters);
  }

  reDrawView(parameters: IParameters): void {
    const { firstValue, firstValuePercent, secondValue, secondValuePercent, theme,
      hasInterval, hasTip, hasScale, scaleValues, isVertical, onChange } = parameters;

    if (onChange) onChange(hasInterval ? `${firstValue} - ${secondValue}` : `${firstValue}`);
    if (this.isNeedToReinit(parameters)) this.reinit(parameters);

    this.changeTheme(theme); // console.log(data);
    this.changeDirection(isVertical);
    this.changeRunnerPosition({ firstValuePercent, secondValuePercent, isVertical, hasInterval  });
    if (hasTip) this.changeTipText({ firstValue, secondValue, hasInterval });
    if (hasTip) this.changeTipPosition({ isVertical, hasInterval });
    if (hasScale) this.drawScale({ scaleValues, isVertical });

    const { left, right } = this.getBarEdges({ hasInterval, isVertical });
    this.changeBarFilling({ from: left, to: right, isVertical });
  }

  private init(parameters: IParameters): void {
    this.drawView(parameters);
    this.findDOMElements(parameters);
    this.addEventListeners();
  }

  private reinit(data: IParameters): void {
    const isNeedToShowRunnerTo = !this.runnerTo && data.hasInterval;
    if (isNeedToShowRunnerTo) {
      this.bar.insertAdjacentHTML('afterend', '<span class="lrs__runner"></span>');

      this.runnerTo = this.bar.nextElementSibling as HTMLSpanElement;
      this.addEventListeners();
    }

    const isNeedToHideRunnerTo = this.runnerTo && !data.hasInterval;
    if (isNeedToHideRunnerTo) {
      this.slider.removeChild(this.runnerTo);

      delete this.runnerTo;
    }

    const isNeedToShowTipFrom = !this.tipFrom && data.hasTip;
    if (isNeedToShowTipFrom) {
      this.bar.insertAdjacentHTML('beforebegin', '<span class="lrs__tip"></span>');

      this.tipFrom = this.runnerFrom.nextElementSibling as HTMLSpanElement;
    }

    const isNeedToHideTipFrom = this.tipFrom && !data.hasTip;
    if (isNeedToHideTipFrom) {
      this.slider.removeChild(this.tipFrom);

      delete this.tipFrom;
    }

    const isNeedToShowTipTo = !this.tipTo && data.hasTip && data.hasInterval;
    if (isNeedToShowTipTo) {
      this.runnerTo.insertAdjacentHTML('afterend', '<span class="lrs__tip"></span>');

      this.tipTo = this.runnerTo.nextElementSibling as HTMLSpanElement;
    }

    const isNeedToHideTipTo = (this.tipTo && !data.hasTip) || (this.tipTo && !data.hasInterval);
    if (isNeedToHideTipTo) {
      this.slider.removeChild(this.tipTo);

      delete this.tipTo;
    }

    const isNeedToShowScale = !this.scale && data.hasScale;
    if (isNeedToShowScale) {
      this.slider.insertAdjacentHTML('beforeend', '<span class="lrs__scale"></span>');

      this.scale = this.slider.lastElementChild as HTMLSpanElement;
      this.addEventListeners();
    }

    const isNeedToHideScale = this.scale && !data.hasScale;
    if (isNeedToHideScale) {
      this.slider.removeChild(this.scale);

      delete this.scale;
    }
  }

  private isNeedToReinit(data: IParameters): boolean {
    return (
      (!this.tipFrom && data.hasTip) ||
      (this.tipFrom && !data.hasTip) ||
      (!this.runnerTo && data.hasInterval) ||
      (this.runnerTo && !data.hasInterval) ||
      (!this.scale && data.hasScale) ||
      (this.scale && !data.hasScale)
    );
  }

  private drawView(parameters: IParameters): void {
    this.anchorElement.insertAdjacentHTML('beforebegin', sliderTemplateHbs(parameters));
  }

  private findDOMElements(parameters: IParameters): void {
    this.slider = this.anchorElement.previousElementSibling as HTMLSpanElement;
    this.runnerFrom = this.slider.firstElementChild as HTMLSpanElement;
    this.bar = this.slider.querySelector('.lrs__bar') as HTMLSpanElement;

    if (parameters.hasInterval) {
      this.runnerTo = this.bar.nextElementSibling as HTMLSpanElement;
    }

    if (parameters.hasTip) {
      this.tipFrom = this.runnerFrom.nextElementSibling as HTMLSpanElement;

      if (parameters.hasInterval) {
        this.tipTo = this.runnerTo.nextElementSibling as HTMLSpanElement;

      }
    }

    if (parameters.hasScale) {
      this.scale = this.slider.lastElementChild as HTMLSpanElement;
    }
  }

  private addEventListeners(): void {
    this.runnerFrom.addEventListener('mousedown', this.handleRunnerMouseDown.bind(this));

    if (this.runnerTo) {
      this.runnerTo.addEventListener('mousedown', this.handleRunnerMouseDown.bind(this));
    }

    if (this.scale) this.scale.addEventListener('click', this.handleScaleClick.bind(this));
  }

  private handleRunnerMouseDown(evt: MouseEvent): void {
    const runner: HTMLSpanElement = evt.currentTarget as HTMLSpanElement;
    const cursorPosition = this.getCursorPosition(runner, evt.clientX, evt.clientY);

    runner.classList.add('lrs__runner_grabbed');

    if (this.runnerTo) this.correctZAxis(runner);

    const handlerWindowMouseMove = (event: MouseEvent): void => {
      let runnerPosition = this.getRunnerShift(cursorPosition, event.clientX, event.clientY);
      runnerPosition = this.correctExtremeRunnerPositions(runner, runnerPosition);
      runnerPosition = this.slider.classList.contains('lrs_direction_vertical')
        ? (runnerPosition * 100) / (this.slider.offsetHeight - runner.offsetHeight)
        : (runnerPosition * 100) / (this.slider.offsetWidth - runner.offsetWidth);

      const positionType = runner === this.runnerFrom ? 'firstPositionPercent' : 'secondPositionPercent';

      this.notify('moveRunner', {  [positionType]: runnerPosition });
    };

    const handlerWindowMouseUp = (): void => {
      runner.classList.remove('lrs__runner_grabbed');

      window.removeEventListener('mousemove', handlerWindowMouseMove);
      window.removeEventListener('mouseup', handlerWindowMouseUp);
    };

    window.addEventListener('mousemove', handlerWindowMouseMove);
    window.addEventListener('mouseup', handlerWindowMouseUp);
  }

  private handleScaleClick(evt: MouseEvent): void {
    const target: HTMLSpanElement = evt.target as HTMLSpanElement;

    if (target.classList.contains('lrs__scale-mark')) {
      this.notify('clickScale', { scaleValue: +target.textContent });
    }
  }

  private getCursorPosition(target: HTMLSpanElement, clientX: number, clientY: number): number {
    return this.slider.classList.contains('lrs_direction_vertical')
      ? clientY + (parseFloat(target.style.bottom) || 0)
      : clientX - (parseFloat(target.style.left) || 0);
  }

  private getRunnerShift(position: number, clientX: number, clientY: number): number {
    return this.slider.classList.contains('lrs_direction_vertical')
      ? position - clientY
      : clientX - position;
  }

  private correctExtremeRunnerPositions(runner: HTMLElement, position: number): number {
    let newPosition = position;

    if (this.slider.classList.contains('lrs_direction_vertical')) {
      if (this.runnerTo) {
        if (runner === this.runnerFrom) {
          const maxRunnerPosition = parseFloat(this.runnerTo.style.bottom);

          if (position < 0) newPosition = 0;
          if (position > maxRunnerPosition) newPosition = maxRunnerPosition;
        }

        if (runner === this.runnerTo) {
          const maxRunnerPosition = this.slider.offsetHeight - runner.offsetHeight;
          const minRunnerPosition = parseFloat(this.runnerFrom.style.bottom);

          if (position < minRunnerPosition) newPosition = minRunnerPosition;
          if (position > maxRunnerPosition) newPosition = maxRunnerPosition;
        }
      }

      if (!this.runnerTo) {
        const maxRunnerPosition = this.slider.offsetHeight - runner.offsetHeight;

        if (position < 0) newPosition = 0;
        if (position > maxRunnerPosition) newPosition = maxRunnerPosition;
      }
    }

    if (!this.slider.classList.contains('lrs_direction_vertical')) {
      if (this.runnerTo) {
        if (runner === this.runnerFrom) {
          const maxRunnerPosition = parseFloat(this.runnerTo.style.left);

          if (position < 0) newPosition = 0;
          if (position > maxRunnerPosition) newPosition = maxRunnerPosition;
        }

        if (runner === this.runnerTo) {
          const maxRunnerPosition = this.slider.offsetWidth - runner.offsetWidth;
          const minRunnerPosition = parseFloat(this.runnerFrom.style.left);

          if (position < minRunnerPosition) newPosition = minRunnerPosition;
          if (position > maxRunnerPosition) newPosition = maxRunnerPosition;
        }
      }

      if (!this.runnerTo) {
        const maxRunnerPosition = this.slider.offsetWidth - runner.offsetWidth;

        if (position < 0) newPosition = 0;
        if (position > maxRunnerPosition) newPosition = maxRunnerPosition;
      }
    }

    return newPosition;
  }

  private correctZAxis(runner: HTMLElement): void {
    this.runnerFrom.classList.remove('lrs__runner_last-grabbed');
    this.runnerTo.classList.remove('lrs__runner_last-grabbed');

    runner.classList.add('lrs__runner_last-grabbed');
  }

  // tslint:disable-next-line:max-line-length
  private changeRunnerPosition({ firstValuePercent, secondValuePercent, isVertical, hasInterval }): void {
    this.runnerFrom.style.cssText = isVertical
      ? `bottom: ${((this.slider.offsetHeight - this.runnerFrom.offsetHeight) * firstValuePercent) / 100}px`
      : `left: ${((this.slider.offsetWidth - this.runnerFrom.offsetWidth) * firstValuePercent) / 100}px`;

    if (hasInterval) {
      this.runnerTo.style.cssText = isVertical
        ? `bottom: ${((this.slider.offsetHeight - this.runnerTo.offsetHeight) * secondValuePercent) / 100}px`
        : `left: ${((this.slider.offsetWidth - this.runnerTo.offsetWidth) * secondValuePercent) / 100}px`;
    }
  }

  private changeTipText({ firstValue, secondValue, hasInterval }): void {
    this.tipFrom.textContent = String(firstValue);
    if (hasInterval) this.tipTo.textContent = String(secondValue);
  }

  private changeTipPosition({ isVertical, hasInterval }): void {
    this.tipFrom.style.cssText = isVertical
      ? `bottom:${(parseFloat(this.runnerFrom.style.bottom) - (this.tipFrom.offsetHeight - this.runnerFrom.offsetHeight) / 2)}px`
      : `left:${(parseFloat(this.runnerFrom.style.left) - (this.tipFrom.offsetWidth - this.runnerFrom.offsetWidth) / 2)}px`;

    if (hasInterval) {
      this.tipTo.style.cssText = isVertical
        ? `bottom:${(parseFloat(this.runnerTo.style.bottom) - (this.tipTo.offsetHeight - this.runnerTo.offsetHeight) / 2)}px`
        : `left:${(parseFloat(this.runnerTo.style.left) - (this.tipTo.offsetWidth - this.runnerTo.offsetWidth) / 2)}px`;
    }
  }

  private getBarEdges({ hasInterval, isVertical }): any {
    const barEdges = { left: 0, right: 0 };

    if (hasInterval) {
      barEdges.left = isVertical
        ? parseFloat(this.runnerFrom.style.bottom) + this.runnerFrom.offsetHeight / 2
        : parseFloat(this.runnerFrom.style.left) + this.runnerFrom.offsetWidth / 2;

      barEdges.right = isVertical
        ? this.slider.offsetHeight -
          (parseFloat(this.runnerTo.style.bottom) + this.runnerTo.offsetHeight / 2)
        : this.slider.offsetWidth -
          (parseFloat(this.runnerTo.style.left) + this.runnerTo.offsetWidth / 2);
    }

    if (!hasInterval) {
      barEdges.left = 0;
      barEdges.right = isVertical
        ? this.slider.offsetHeight -
          (parseFloat(this.runnerFrom.style.bottom) + this.runnerFrom.offsetHeight / 2)
        : this.slider.offsetWidth -
          (parseFloat(this.runnerFrom.style.left) + this.runnerFrom.offsetWidth / 2);
    }

    return barEdges;
  }

  private changeBarFilling({ from, to, isVertical }): void {
    this.bar.style.cssText = isVertical
      ? `bottom: ${from}px; top: ${to}px;`
      : `left: ${from}px; right: ${to}px;`;
  }

  private changeTheme(theme: string): void {
    this.slider.classList.remove(`lrs_theme_${theme === 'aqua' ? 'red' : 'aqua'}`);
    this.slider.classList.add(`lrs_theme_${theme === 'aqua' ? 'aqua' : 'red'}`);
  }

  private changeDirection(isVertical: boolean): void {
    if (isVertical) this.slider.classList.add('lrs_direction_vertical');
    if (!isVertical) this.slider.classList.remove('lrs_direction_vertical');
  }

  private drawScale({ scaleValues, isVertical }): void {
    this.scale.textContent = '';

    const elements = [];
    const marks = Object.entries(scaleValues);

    for (let i: number = 0; i < marks.length; i += 1) {
      const [value, percent] = marks[i];

      const mark = document.createElement('span');
      mark.classList.add('lrs__scale-mark');
      mark.textContent = value;

      mark.style.cssText = isVertical
        ? `bottom:${((this.slider.offsetHeight - this.runnerFrom.offsetHeight) / 100) * +percent}px`
        : `left:${((this.slider.offsetWidth - this.runnerFrom.offsetWidth) / 100) * +percent}px`;

      elements.push(mark);
    }

    this.scale.append(...elements);
  }
}
