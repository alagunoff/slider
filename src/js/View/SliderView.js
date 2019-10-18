/* eslint-disable class-methods-use-this */
/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
/* global window */

import EventEmitter from '../EventEmitter/EventEmitter';
import templateFunction from '../../templates/sliderTemplate.hbs';

export default class SliderView extends EventEmitter {
  constructor(input, parameters) {
    super();

    this.input = input;

    this._init(parameters);
  }

  reDrawView(data) {
    const value = this._getSliderValue(data); // console.log(data);
    this.input.changeValue(value);

    if (data.onChange) data.onChange(this.input.getValue());

    this._changeTheme(data.theme);
    this._changeDirection(data.isVertical);

    this._changeRunnerPosition(data);
    this._changeTipText(data);
    this._changeTipPosition(data);

    const { left: barLeftEdge, right: barRightEdge } = this._getBarEdges(data);
    this._changeBarFilling(barLeftEdge, barRightEdge, data);
  }

  _init(parameters) {
    this._drawView(parameters);
    this._findDOMElements(parameters);
    this._addEventListeners();
  }

  // _reInit(data) {
  //   if (correctedSettings.hasInterval !== currentState.hasInterval) {
  //     const isRunnerToNotExists = !this.view.runnerTo && correctedSettings.hasInterval;

  //     if (isRunnerToNotExists) {
  //       this.view.slider.insertAdjacentHTML('beforeend', '<span class="lrs__runner"></span>');
  //       [, this.view.runnerTo] = this.view.slider.querySelectorAll('.lrs__runner');
  //       this.view._addEventListeners();
  //     }

  //     const isTipToNotExists = !this.view.tipTo
  //       && correctedSettings.hasInterval
  //       && correctedSettings.hasTip;

  //     if (isTipToNotExists) {
  //       this.view.runnerTo.insertAdjacentHTML('afterend', '<span class="lrs__tip"></span>');
  //       [, this.view.tipTo] = this.view.slider.querySelectorAll('.lrs__tip');
  //     }

  //     if (correctedSettings.hasInterval) {
  //       this.view.runnerTo.classList.remove('lrs__runner_hidden');

  //       if (correctedSettings.hasTip) {
  //         this.view.tipTo.classList.remove('lrs__tip_hidden');
  //       }
  //     }

  //     if (!correctedSettings.hasInterval) {
  //       this.view.runnerTo.classList.add('lrs__runner_hidden');

  //       if (correctedSettings.hasTip) {
  //         this.view.tipTo.classList.add('lrs__tip_hidden');
  //       }
  //     }

  //     currentState.hasInterval = correctedSettings.hasInterval;
  //   }

  //   if (correctedSettings.hasTip !== currentState.hasTip) {
  //     const isTipFromNotExists = !this.view.tipFrom && correctedSettings.hasTip;
  //     if (isTipFromNotExists) {
  //       this.view.runnerFrom.insertAdjacentHTML('afterend', '<span class="lrs__tip"></span>');
  //       [this.view.tipFrom] = this.view.slider.querySelectorAll('.lrs__tip');
  //     }

  //     const isTipFromNeedToBeHidden = this.view.tipFrom && !correctedSettings.hasTip;
  //     if (isTipFromNeedToBeHidden) this.view.tipFrom.classList.add('lrs__tip_hidden');

  //     const isTipFromNeedToBeShowed = this.view.tipFrom && correctedSettings.hasTip;
  //     if (isTipFromNeedToBeShowed) this.view.tipFrom.classList.remove('lrs__tip_hidden');

  //     const isTipToNotExists = !this.view.tipTo
  //       && correctedSettings.hasTip
  //       && correctedSettings.hasInterval;
  //     if (isTipToNotExists) {
  //       this.view.runnerTo.insertAdjacentHTML('afterend', '<span class="lrs__tip"></span>');
  //       [, this.view.tipTo] = this.view.slider.querySelectorAll('.lrs__tip');
  //     }

  //     const isTipToNeedToBeHidden = this.view.tipTo
  //       && !correctedSettings.hasTip
  //       && correctedSettings.hasInterval;
  //     if (isTipToNeedToBeHidden) this.view.tipTo.classList.add('lrs__tip_hidden');

  //     const isTipToNeedToBeShowed = this.view.tipTo
  //       && correctedSettings.hasTip
  //       && correctedSettings.hasInterval;
  //     if (isTipToNeedToBeShowed) this.view.tipTo.classList.remove('lrs__tip_hidden');
  //   }
  // }

  _drawView(parameters) {
    const input = this.input.getInput();

    input.insertAdjacentHTML('beforeBegin', templateFunction(parameters));
  }

  _findDOMElements(parameters) {
    const input = this.input.getInput();

    this.slider = input.previousElementSibling;
    this.runnerFrom = this.slider.firstElementChild;
    this.bar = this.slider.querySelector('.lrs__bar');

    if (parameters.hasInterval) {
      this.runnerTo = this.bar.nextElementSibling;
    }

    if (parameters.hasTip) {
      this.tipFrom = this.runnerFrom.nextElementSibling;

      if (this.runnerTo) {
        this.tipTo = this.runnerTo.nextElementSibling;
      }
    }
  }

  _addEventListeners() {
    this.runnerFrom.addEventListener('mousedown', this._handlerRunnerMouseDown.bind(this));
    if (this.runnerTo) this.runnerTo.addEventListener('mousedown', this._handlerRunnerMouseDown.bind(this));
  }

  _handlerRunnerMouseDown(evt) {
    const runner = evt.currentTarget;
    const runnerType = runner === this.runnerFrom ? 'from' : 'to';
    const cursorPosition = this._getCursorPosition(runner, evt.clientX, evt.clientY);

    this._correctZAxis(runner);

    const handlerWindowMouseMove = (event) => {
      let runnerPosition = this._getRunnerShift(cursorPosition, event.clientX, event.clientY);
      runnerPosition = this._correctExtremeRunnerPositions(runner, runnerPosition);
      runnerPosition = this.slider.classList.contains('lrs_direction_vertical')
        ? (runnerPosition * 100) / (this.slider.offsetHeight - runner.offsetHeight)
        : (runnerPosition * 100) / (this.slider.offsetWidth - runner.offsetWidth);

      this.notify('moveRunner', { [runnerType]: runnerPosition });
    };

    const handlerWindowMouseUp = () => {
      runner.classList.remove('lrs__runner_grabbed');

      window.removeEventListener('mousemove', handlerWindowMouseMove);
      window.removeEventListener('mouseup', handlerWindowMouseUp);
    };

    window.addEventListener('mousemove', handlerWindowMouseMove);
    window.addEventListener('mouseup', handlerWindowMouseUp);
  }

  _getSliderValue(data) {
    const value = data.hasInterval
      ? `${Math.round((data.min + (data.from * (data.max - data.min)) / 100))} - ${Math.round((data.min + ((data.to * (data.max - data.min)) / 100)))}`
      : `${Math.round((data.min + (data.from * (data.max - data.min)) / 100))}`;

    return value;
  }

  _getCursorPosition(target, clientX, clientY) {
    return this.slider.classList.contains('lrs_direction_vertical')
      ? clientY + (parseFloat(target.style.bottom) || 0)
      : clientX - (parseFloat(target.style.left) || 0);
  }

  _getRunnerShift(position, clientX, clientY) {
    return this.slider.classList.contains('lrs_direction_vertical') ? position - clientY : clientX - position;
  }

  _correctExtremeRunnerPositions(runner, position) {
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

  _correctZAxis(runner) {
    runner.classList.add('lrs__runner_grabbed');

    if (this.runnerTo) {
      this.runnerFrom.classList.remove('lrs__runner_last-grabbed');
      this.runnerTo.classList.remove('lrs__runner_last-grabbed');
      runner.classList.add('lrs__runner_last-grabbed');
    }
  }

  _changeRunnerPosition(data) {
    let position = data.isVertical
      ? ((this.slider.offsetHeight - this.runnerFrom.offsetHeight) * data.from) / 100
      : ((this.slider.offsetWidth - this.runnerFrom.offsetWidth) * data.from) / 100;

    this.runnerFrom.style.cssText = data.isVertical ? `bottom: ${position}px` : `left: ${position}px`;

    if (data.hasInterval) {
      position = data.isVertical
        ? ((this.slider.offsetHeight - this.runnerTo.offsetHeight) * data.to) / 100
        : ((this.slider.offsetWidth - this.runnerTo.offsetWidth) * data.to) / 100;

      this.runnerTo.style.cssText = data.isVertical ? `bottom: ${position}px` : `left: ${position}px`;
    }
  }

  _changeTipText(data) {
    if (data.hasTip) {
      if (data.hasInterval) {
        const [textFrom, textTo] = this.input.getValue().split(' - ');

        this.tipFrom.textContent = textFrom;
        this.tipTo.textContent = textTo;
      }

      if (!data.hasInterval) {
        this.tipFrom.textContent = this.input.getValue();
      }
    }
  }

  _changeTipPosition(data) {
    if (data.hasTip) {
      let runner = this.runnerFrom;
      let runnerPosition = data.isVertical ? parseFloat(runner.style.bottom) : parseFloat(runner.style.left);
      let tip = this.tipFrom;
      let tipPosition = data.isVertical
        ? runnerPosition - (tip.offsetHeight - runner.offsetHeight) / 2
        : runnerPosition - (tip.offsetWidth - runner.offsetWidth) / 2;

      this.tipFrom.style.cssText = data.isVertical ? `bottom: ${tipPosition}px` : `left: ${tipPosition}px`;

      if (data.hasInterval) {
        runner = this.runnerTo;
        runnerPosition = data.isVertical ? parseFloat(runner.style.bottom) : parseFloat(runner.style.left);
        tip = this.tipTo;
        tipPosition = data.isVertical
          ? runnerPosition - (tip.offsetHeight - runner.offsetHeight) / 2
          : runnerPosition - (tip.offsetWidth - runner.offsetWidth) / 2;

        this.tipTo.style.cssText = data.isVertical ? `bottom: ${tipPosition}px` : `left: ${tipPosition}px`;
      }
    }
  }

  _getBarEdges(data) {
    const barEdges = {
      left: 0,
      right: 0,
    };

    if (data.hasInterval) {
      barEdges.left = data.isVertical
        ? parseFloat(this.runnerFrom.style.bottom) + this.runnerFrom.offsetHeight / 2
        : parseFloat(this.runnerFrom.style.left) + this.runnerFrom.offsetWidth / 2;

      barEdges.right = data.isVertical
        ? this.slider.offsetHeight - (parseFloat(this.runnerTo.style.bottom) + this.runnerTo.offsetHeight / 2)
        : this.slider.offsetWidth - (parseFloat(this.runnerTo.style.left) + this.runnerTo.offsetWidth / 2);
    }

    if (!data.hasInterval) {
      barEdges.left = 0;
      barEdges.right = data.isVertical
        ? this.slider.offsetHeight - (parseFloat(this.runnerFrom.style.bottom) + this.runnerFrom.offsetHeight / 2)
        : this.slider.offsetWidth - (parseFloat(this.runnerFrom.style.left) + this.runnerFrom.offsetWidth / 2);
    }

    return barEdges;
  }

  _changeBarFilling(from, to, data) {
    this.bar.style.cssText = data.isVertical
      ? `bottom: ${from}px; top: ${to}px;`
      : `left: ${from}px; right: ${to}px;`;
  }

  _changeTheme(theme) {
    if (theme === 'aqua') {
      this.slider.classList.remove('lrs_theme_red');
      this.slider.classList.add('lrs_theme_aqua');
    }

    if (theme === 'red') {
      this.slider.classList.remove('lrs_theme_aqua');
      this.slider.classList.add('lrs_theme_red');
    }
  }

  _changeDirection(isVertical) {
    if (isVertical) {
      this.slider.classList.add('lrs_direction_vertical');
    }

    if (!isVertical) {
      this.slider.classList.remove('lrs_direction_vertical');
    }
  }
}
