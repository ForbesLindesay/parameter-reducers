export type SuccessParameterReducerResult<T, S> = {
  valid: true;
  rest: string[];
  parsed: Omit<S, keyof T> &
    {[key in keyof T]?: T[key] | (key extends keyof S ? S[key] : never)};
};
export type ParameterReducerResult<T, S> =
  | undefined
  | SuccessParameterReducerResult<T, S>
  | {valid: false; reason: string};
export type ParameterReducer<TParsed> = <TAlreadyParsed>(
  input: string[],
  parsed: TAlreadyParsed,
) => ParameterReducerResult<TParsed, TAlreadyParsed>;

export type ParsedString<TParsed> =
  | {readonly valid: true; readonly value: TParsed}
  | {readonly valid: false; readonly reason: string};
