import ITranspiler from './ITranspiler';
import { DjangoTranspiler } from './DjangoTranspiler';
import { HtlTranspiler } from './HtlTranspiler';
import { TwigTranspiler } from './TwigTranspiler';

const convert = (input, template = 'django') => {
  let transpiler: ITranspiler;
  if (template === 'django') {
    transpiler = new DjangoTranspiler(input);
  } else if (template === 'twig') {
    transpiler = new TwigTranspiler(input);
  } else if (template === 'htl') {
    transpiler = new HtlTranspiler(input);
  }
  const output = transpiler.toString();
  return output;
};

export default convert;
