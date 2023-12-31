import './index.scss';
import '../components/slider';
import { DEFAULT_PARAMETERS } from '../utilities/constants';
import Slider from './components/slider/Slider';

const $sliders = $('.js-slider');
$sliders.each(function (i): void {
  new Slider($(this), DEFAULT_PARAMETERS[i]);
});
