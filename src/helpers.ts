import {SuccessParameterReducerResult} from './types';

export function valid<TParsed>(value: TParsed): {valid: true; value: TParsed};
export function valid<TAlreadyParsed, TName extends string, TValue>(
  alreadyParsedOrValue: TAlreadyParsed,
  name: TName,
  value: TValue,
  rest: string[],
): SuccessParameterReducerResult<{[name in TName]: TValue}, TAlreadyParsed>;
export function valid<TAlreadyParsed, TName extends string, TValue>(
  alreadyParsedOrValue: TAlreadyParsed,
  name?: TName,
  value?: TValue,
  rest?: string[],
):
  | {valid: true; value: TAlreadyParsed}
  | SuccessParameterReducerResult<{[name in TName]: TValue}, TAlreadyParsed> {
  if (name === undefined && value === undefined && rest === undefined) {
    return {valid: true, value: alreadyParsedOrValue};
  }
  if (typeof name !== 'string') {
    throw new Error('Expected name to be a string');
  }
  if (!Array.isArray(rest)) {
    throw new Error('Expected rest to be an array');
  }

  return {valid: true, parsed: {...alreadyParsedOrValue, [name]: value}, rest};
}

export function invalid(reason: string): {valid: false; reason: string} {
  return {valid: false, reason};
}
