window.$ = require('jquery');
import RunnerView from './RunnerView';
import IDefaultParameters from '../../Interfaces/IDefaultParameters';

beforeEach((): void => {
  $('body').html('<span class="js-anchor"></span>');
});

const defaultConfig: IDefaultParameters = {
  kind: 'stateUpdated',
  firstValue: 0,
  firstValuePercent: 0,
  min: 0,
  max: 100,
  step: 1,
  hasInterval: false,
  hasTip: false,
  hasScale: false,
  isVertical: false,
  theme: 'aqua',
  secondValue: null,
  secondValuePercent: null,
  onChange: null,
};

describe('Инициализация', (): void => {
  test('Первый ползунок корректно инициализируется', (): void => {
    new RunnerView($('.js-anchor'), defaultConfig, 'firstValue');

    expect($('.range-slider__runner').attr('style')).toEqual('left: 0%');
  });

  test('Второй ползунок корректно инициализируется', (): void => {
    new RunnerView($('.js-anchor'), {...defaultConfig, secondValuePercent: 100}, 'secondValue');

    expect($('.range-slider__runner').attr('style')).toEqual('left: 100%');
  });

  test('Если hasTip = true инициализируется подсказка', (): void => {
    new RunnerView($('.js-anchor'), {...defaultConfig, hasTip: true}, 'firstValue');

    expect($('.range-slider__runner .range-slider__tip').text()).toEqual('0');
  });
});

describe('Обновление ползунка', (): void => {
  test('Положение корректно обновляется', (): void => {
    const runner = new RunnerView($('.js-anchor'), defaultConfig, 'firstValue');
    runner.updateRunner({...defaultConfig, firstValuePercent: 50});

    expect($('.range-slider__runner').attr('style')).toEqual('left: 50%');
  });

  test('Если hasTip = true подсказка обновляется', (): void => {
    const runner = new RunnerView($('.js-anchor'), {...defaultConfig, hasTip: true}, 'firstValue');
    runner.updateRunner({...defaultConfig, hasTip: true, firstValue: 30});

    expect($('.range-slider__runner .range-slider__tip').text()).toEqual('30');
  });
});