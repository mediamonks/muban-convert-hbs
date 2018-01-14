import { Transpiler } from './Transpiler';

const convert = input => {
  const transpiler = new Transpiler(input);
  const output = transpiler.toString();
  return output;
};

export default convert;
