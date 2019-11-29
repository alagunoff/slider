import IProgressBarView from '../../Interfaces/View/ProgressBar/IProgressBarView';
import IDefaultParameters from '../../Interfaces/IDefaultParameters';
import { PERCENT_MIN, PERCENT_MAX } from '../../constants';
import progressBarTemplateHbs, * as template from './progressBarTemplate.hbs';
const templateFunction = progressBarTemplateHbs || template;

export default class ProgressBar implements IProgressBarView {
  private $slider: JQuery;
  private $progressBar: JQuery;

  constructor($slider: JQuery, parameters: IDefaultParameters) {
    this.initProgressBar($slider, parameters);
  }

  public updateProgressBar(leftOffset: number, rightOffset: number | null): void {
    const isVertical = this.$slider.hasClass('range-slider_direction_vertical');
    const leftEdge = rightOffset ? leftOffset : PERCENT_MIN;
    const rightEdge = rightOffset ? PERCENT_MAX - rightOffset : PERCENT_MAX - leftOffset;

    if (isVertical) {
      this.$progressBar.attr('style', `bottom: ${leftEdge}%; top: ${rightEdge}%;`);
    } else {
      this.$progressBar.attr('style', `left: ${leftEdge}%; right: ${rightEdge}%;`);
    }
  }

  private initProgressBar($slider: JQuery, parameters: IDefaultParameters): void {
    this.$slider = $slider;
    this.$progressBar = $(templateFunction());

    this.$slider.append(this.$progressBar);

    const { firstValuePercent, secondValuePercent } = parameters;
    this.updateProgressBar(firstValuePercent, secondValuePercent);
  }
}