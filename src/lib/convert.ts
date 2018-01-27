import { DjangoTranspiler } from './DjangoTranspiler';
import ITranspiler from './ITranspiler';
import { TwigTranspiler } from './TwigTranspiler';

const convert = (input, template = 'django') => {
  let transpiler: ITranspiler;
  if (template === 'django') {
    transpiler = new DjangoTranspiler(input);
  } else if (template === 'twig') {
    transpiler = new TwigTranspiler(input);
  }
  const output = transpiler.toString();
  return output;
};

export default convert;
