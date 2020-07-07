import * as param from './parameters';
import {ParameterReducer} from './types';

export {param};
export {ParameterReducerResult, ParameterReducer, ParsedString} from './types';
export {Chain, startChain} from './chain';
export {valid, invalid} from './helpers';

function extractReason(this: {reason: string}): never {
  console.error(`🚨 ${this.reason}`);
  process.exit(1);
}

function extractResult<T>(this: {rest: string[]; parsed: T}): T {
  if (this.rest.length) {
    console.error(`🚨 Unrecognized option ${this.rest[0]}.`);
    process.exit(1);
  }
  return this.parsed;
}

export function parse<T>(
  parameters: ParameterReducer<T>,
  input: string[],
):
  | {
      valid: false;
      reason: string;
      extract: () => never;
    }
  | {
      valid: true;
      rest: string[];
      parsed: Partial<T>;
      extract: () => Partial<T>;
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
      return {
        ...result,
        extract: extractReason,
      };
    }
  }
  return {
    valid: true,
    rest,
    parsed,
    extract: extractResult,
  };
}
