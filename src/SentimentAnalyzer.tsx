import React, { useState } from "react";
import {
  AnalysisResult,
  SentimentAnalyzerAction,
  SentimentAnalyzerState,
  useSentimentAnalyzerState,
} from "./state";

const SentimentInput: React.FC<{
  dispatch: React.Dispatch<SentimentAnalyzerAction>;
  text: string;
  resultState: SentimentAnalyzerState["resultState"];
}> = ({ text, dispatch, resultState }) => {
  const [localText, setLocalText] = useState(text);
  return (
    <div>
      <input
        type="text"
        value={localText}
        onChange={(event) => setLocalText(event.target.value)}
      />
      <br />
      {resultState.type === "Loading" ? (
        <button
          onClick={() => dispatch({ type: "AnalysisCancellationRequested" })}
        >
          Cancel
        </button>
      ) : (
        <button
          onClick={() =>
            dispatch({ type: "AnalysisRequested", text: localText })
          }
        >
          Submit
        </button>
      )}
    </div>
  );
};

const SentimentVisualization: React.FC<{ results: AnalysisResult }> = ({
  results,
}) => {
  return <span>{results.sentiment === "positive" ? "😊" : "😢"}</span>;
};

export const SentimentAnalyzer = () => {
  const [state, dispatch] = useSentimentAnalyzerState();
  return (
    <div>
      <SentimentInput
        text={state.text}
        dispatch={dispatch}
        resultState={state.resultState}
      />
      {state.resultState.type === "Success" && (
        <SentimentVisualization results={state.resultState.result} />
      )}
      {state.resultState.type === "Loading" && <span>Loading...</span>}
      {state.resultState.type === "Empty" && (
        <span>Run the analysis to see the results</span>
      )}
    </div>
  );
};
