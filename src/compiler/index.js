import { parse } from './parse';
import { generate } from './codegen';

export function compileToFunctions(template) {
    let ast = parse(template);
    console.log('ast：', ast);

    let code = generate(ast);

    let renderFn = new Function(`with(this) { return ${code} }`);
    console.log('renderFn：', renderFn);
    return renderFn;
}