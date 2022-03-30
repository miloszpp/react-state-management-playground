import { merge, Observable, OperatorFunction } from "rxjs";
import { filter } from "rxjs/operators";

export type Action<T = string> = { type: T };

export type Epic<Input extends Action, Output extends Input = Input> = (
  action$: Observable<Input>
) => Observable<Output>;

export function ofType<
  Input extends Action,
  Type extends Input["type"],
  Output extends Input = Extract<Input, Action<Type>>
>(type: Type): OperatorFunction<Input, Output> {
  return filter((action): action is Output => action.type === type);
}

export function combineEpics<T extends Action>(...epics: Epic<T>[]): Epic<T> {
  return (action$: Observable<T>) =>
    merge(...epics.map((epic) => epic(action$)));
}
