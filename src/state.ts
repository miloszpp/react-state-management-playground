import { Dispatch, useCallback, useEffect, useMemo, useReducer } from "react";
import { pipe, Subject } from "rxjs";
import {
  delay,
  filter,
  map,
  repeatWhen,
  switchMap,
  takeUntil,
  takeWhile,
  withLatestFrom,
} from "rxjs/operators";
import { combineEpics, Epic, ofType } from "./epics";
import { cancelTask, getTaskStatus, startAnalysis } from "./network";

export interface AnalysisResult {
  sentiment: "positive" | "negative";
}

export interface PanelBuilderState {
  text: string;
  resultState:
    | { type: "Empty" }
    | { type: "Loading" }
    | { type: "Success"; result: AnalysisResult };
}

export type PanelBuilderAction =
  | { type: "AnalysisRequested"; text: string }
  | { type: "AnalysisStarted"; taskId: number }
  | { type: "AnalysisFinished"; results: AnalysisResult }
  | { type: "AnalysisCancellationRequested" }
  | { type: "AnalysisCancelled" };

const panelBuilderReducer = (
  state: PanelBuilderState,
  action: PanelBuilderAction
): PanelBuilderState => {
  switch (action.type) {
    case "AnalysisFinished":
      return {
        ...state,
        resultState: { type: "Success", result: action.results },
      };
    case "AnalysisRequested":
      return {
        ...state,
        text: action.text,
        resultState: { type: "Loading" },
      };
    case "AnalysisCancelled":
      return {
        ...state,
        resultState: { type: "Empty" },
      };
    case "AnalysisStarted":
    case "AnalysisCancellationRequested":
      return state;
  }
};

const startAnalysisEpic: Epic<PanelBuilderAction> = pipe(
  ofType("AnalysisRequested"),
  switchMap((action) => startAnalysis(action.text)),
  map((task) => ({ type: "AnalysisStarted", taskId: task.id }))
);

const pollAnalysisResultsEpic: Epic<PanelBuilderAction> = (action$) =>
  action$.pipe(
    ofType("AnalysisStarted"),
    switchMap((action) =>
      getTaskStatus(action.taskId).pipe(
        repeatWhen(delay(1000)),
        takeWhile((response) => response.status === "inProgress", true),
        takeUntil(action$.pipe(ofType("AnalysisCancellationRequested")))
      )
    ),
    filter((results) => results.status === "finished"),
    map((results) => ({
      type: "AnalysisFinished",
      results: { sentiment: results.result! },
    }))
  );

const cancelAnalysisEpic: Epic<PanelBuilderAction> = (action$) =>
  action$.pipe(
    ofType("AnalysisCancellationRequested"),
    withLatestFrom(action$.pipe(ofType("AnalysisStarted"))),
    switchMap(([, AnalysisStartedAction]) =>
      cancelTask(AnalysisStartedAction.taskId)
    ),
    map(() => ({ type: "AnalysisCancelled" }))
  );

const epic = combineEpics(
  startAnalysisEpic,
  pollAnalysisResultsEpic,
  cancelAnalysisEpic
);

const initialState: PanelBuilderState = {
  text: "",
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
      dispatch(action);
    });
    return () => subscription.unsubscribe();
  }, [dispatch, subject]);

  const value = useMemo(() => [state, dispatch] as const, [state, dispatch]);

  return value;
};
