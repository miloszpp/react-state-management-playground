import { Dispatch, useCallback, useEffect, useMemo, useReducer } from "react";
import { Observable, of, Subject } from "rxjs";
import { catchError, map, mapTo, switchMap, tap } from "rxjs/operators";
import { combineEpics, ofType } from "./epics";
import { fetchPanelData } from "./network";

export interface QueryResults {
  series: { x: number; y: number }[][];
}

export interface PanelBuilderState {
  query: string;
  resultState:
    | { type: "Empty" }
    | { type: "Loading" }
    | { type: "Success"; results: QueryResults }
    | { type: "Error"; error: string };
}

export type PanelBuilderAction =
  | { type: "QuerySubmitted"; query: string }
  | { type: "ResultsLoaded"; results: QueryResults }
  | { type: "QueryFailed"; error: string }
  | { type: "DummyAction" };

const panelBuilderReducer = (
  state: PanelBuilderState,
  action: PanelBuilderAction
): PanelBuilderState => {
  switch (action.type) {
    case "ResultsLoaded":
      return {
        ...state,
        resultState: { type: "Success", results: action.results },
      };
    case "QueryFailed":
      return {
        ...state,
        resultState: { type: "Error", error: action.error },
      };
    case "QuerySubmitted":
      return {
        ...state,
        query: action.query,
        resultState: { type: "Loading" },
      };
    case "DummyAction":
      return state;
  }
};

const dataFetchingEpic = (
  action$: Observable<PanelBuilderAction>
): Observable<PanelBuilderAction> =>
  action$.pipe(
    ofType("QuerySubmitted"),
    switchMap((action) => fetchPanelData(action.query)),
    tap((data) => console.log("received panel data", data)),
    map((results) => ({ type: "ResultsLoaded", results } as const)),
    catchError((value) =>
      of({ type: "QueryFailed", error: `Error: ${value}` } as const)
    )
  );

const dummyEpic = (
  action$: Observable<PanelBuilderAction>
): Observable<PanelBuilderAction> =>
  action$.pipe(ofType("QuerySubmitted"), mapTo({ type: "DummyAction" }));

// todo try combining multiple epics
const epic = combineEpics(dataFetchingEpic, dummyEpic);

const initialState: PanelBuilderState = {
  query: "",
  resultState: { type: "Empty" },
};

export const usePanelBuilderState = () => {
  const [state, rawDispatch] = useReducer(panelBuilderReducer, initialState);

  const subject = useMemo(() => new Subject<PanelBuilderAction>(), []);

  const dispatch: Dispatch<PanelBuilderAction> = useCallback(
    (action: PanelBuilderAction) => {
      subject.next(action);
      rawDispatch(action);
    },
    [rawDispatch, subject]
  );

  useEffect(() => {
    const subscription = epic(subject).subscribe((action) => {
      console.log("epic emitted action", action);
      dispatch(action);
    });
    return () => subscription.unsubscribe();
  }, [dispatch, subject]);

  const value = useMemo(() => [state, dispatch] as const, [state, dispatch]);

  return value;
};
