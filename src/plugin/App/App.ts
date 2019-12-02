import Model from '../Model/Model';
import Slider from '../View/Slider/Slider';
import Presenter from '../Presenter/Presenter';
import IApp from '../Interfaces/App/IApp';
import IDefaultParameters from '../Interfaces/Model/IDefaultParameters';
import IRegularParameters from '../Interfaces/View/IRegularParameters';

export default class App implements IApp {
  private model: Model;
  private view: Slider;

  constructor(anchorElement: JQuery, parameters: IRegularParameters) {
    this.model = new Model(parameters);
    this.view = new Slider(anchorElement, this.model.getState());
    new Presenter(this.model, this.view);
  }

  public update(parameters: Partial<IDefaultParameters> = {}): void {
    this.model.dispatchState({ ...this.model.getState(), ...parameters, kind: 'stateUpdated' });
  }
}
