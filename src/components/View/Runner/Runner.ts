import Observer from '../../Observer/Observer';
import IRunner from '../../Interfaces/View/Runner/IRunner';
import Tip from '../Tip/Tip';
import { IDefaultParameters } from '../../Interfaces/Model/IModel';
import { PERCENT_MIN, PERCENT_MAX } from '../../constants';
import runnerTemplateHbs, * as template from './runner.template.hbs';
const templateFunction = runnerTemplateHbs || template;

class Runner extends Observer implements IRunner {
  private $slider: JQuery;
  private $runner: JQuery;
  private tip: Tip;
  private runnerType: 'firstValue' | 'secondValue';

  constructor($slider: JQuery, parameters: IDefaultParameters, runnerType: 'firstValue' | 'secondValue') {
    super();

    this.initRunner($slider, parameters, runnerType);
  }

  public updateRunner(parameters: IDefaultParameters): void {
    const { isVertical, hasTip, firstValuePercent, secondValuePercent } = parameters;
    const position = this.runnerType === 'firstValue' ? firstValuePercent : secondValuePercent;
    this.$runner.attr('style', `${isVertical ? 'bottom' : 'left'}: ${position}%`);

    if (hasTip) {
      this.tip.updateTip(parameters[this.runnerType]);
    }
  }

  public correctZAxis(): void {
    this.$runner.addClass('range-slider__runner_type_last-grabbed js-range-slider__runner_type_last-grabbed');
  }

  private initRunner($slider: JQuery, parameters: IDefaultParameters, runnerType: 'firstValue' | 'secondValue'): void {
    this.$slider = $slider;
    this.$runner = $(templateFunction(parameters));
    this.runnerType = runnerType;

    if (parameters.hasTip) {
      this.tip = new Tip(this.$runner, parameters[this.runnerType]);
    }

    this.$slider.append(this.$runner);
    this.addEventListeners();
    this.updateRunner(parameters);
  }

  private addEventListeners(): void {
    this.$runner.on('mousedown', this.handleRunnerMouseDown);
  }

  private handleRunnerMouseDown = (evt: JQuery.MouseDownEvent): void => {
    const $runner: JQuery = $(evt.currentTarget).addClass('range-slider__runner_grabbed js-range-slider__runner_grabbed');
    const cursorPosition = this.getCursorPosition($runner, evt.clientX, evt.clientY);
    const metric = this.$slider.hasClass('js-range-slider_direction_vertical') ? 'outerHeight' : 'outerWidth';

    this.$slider
      .find('.js-range-slider__runner_type_last-grabbed')
      .removeClass('range-slider__runner_type_last-grabbed js-range-slider__runner_type_last-grabbed');

    $runner.addClass('range-slider__runner_type_last-grabbed js-range-slider__runner_type_last-grabbed');

    const handleWindowMouseMove = (e: JQuery.Event): void => {
      const runnerShift = this.getRunnerShift(cursorPosition, e.clientX, e.clientY);
      const runnerShiftPercent = runnerShift * PERCENT_MAX / this.$slider[metric]();

      this.notify('movedRunner', { percent: runnerShiftPercent, lastUpdatedOnPercent: this.runnerType });
    };

    const handleWindowMouseUp = (): void => {
      $runner.removeClass('range-slider__runner_grabbed js-range-slider__runner_grabbed');

      $(window).off('mousemove', handleWindowMouseMove).off('mouseup', handleWindowMouseUp);
    };

    $(window).on('mousemove', handleWindowMouseMove).on('mouseup', handleWindowMouseUp);
  }

  private getCursorPosition($target: JQuery, clientX: number, clientY: number): number {
    return this.$slider.hasClass('range-slider_direction_vertical')
      ? clientY + (parseFloat($target.css('bottom')) || PERCENT_MIN)
      : clientX - (parseFloat($target.css('left')) || PERCENT_MIN);
  }

  private getRunnerShift(position: number, clientX: number, clientY: number): number {
    return this.$slider.hasClass('range-slider_direction_vertical')
      ? position - clientY
      : clientX - position;
  }
}

export default Runner;
