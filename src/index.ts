import * as param from './parameters';
import {ParameterReducer} from './types';

export {param};
export {ParameterReducerResult, ParameterReducer, ParsedString} from './types';
export {Chain, startChain} from './chain';
export {valid, invalid} from './helpers';

export function parse<T>(
  parameters: ParameterReducer<T>,
  input: string[],
):
  | {
      valid: false;
      reason: string;
    }
  | {
      valid: true;
      rest: string[];
      parsed: Partial<T>;
    } {
  let rest = input;
  let parsed = {};
  while (rest.length) {
    const result = parameters(rest, parsed);
    if (result === undefined) {
      break;
    }
    if (result.valid) {
      rest = result.rest;
      parsed = result.parsed;
    } else {
      return result;
    }
  }
  return {
    valid: true,
    rest,
    parsed,
  };
}
