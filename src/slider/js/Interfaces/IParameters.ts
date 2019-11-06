export default interface IParameters {
  firstValue?: number;
  secondValue?: number | null;
  min?: number;
  max?: number;
  step?: number;
  hasInterval?: boolean;
  hasTip?: boolean;
  hasScale?: boolean;
  isVertical?: boolean;
  theme?: string;
  onChange?: null | Function;
}