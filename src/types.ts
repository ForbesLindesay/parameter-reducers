export type ParameterReducerResult<T, S> =
  | undefined
  | {
      valid: true;
      rest: string[];
      parsed: Omit<S, keyof T> &
        {[key in keyof T]?: T[key] | (key extends keyof S ? S[key] : never)};
    }
  | {valid: false; reason: string};
export type ParameterReducer<TParsed> = <TAlreadyParsed>(
  input: string[],
  parsed: TAlreadyParsed,
) => ParameterReducerResult<TParsed, TAlreadyParsed>;