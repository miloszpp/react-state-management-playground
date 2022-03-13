import React, { useState } from "react";
import {
  PanelBuilderAction,
  QueryResults,
  usePanelBuilderState,
} from "./state";

const QueryInput: React.FC<{
  dispatch: React.Dispatch<PanelBuilderAction>;
  query: string;
}> = ({ query, dispatch }) => {
  const [localQuery, setLocalQuery] = useState(query);
  return (
    <div>
      <input
        type="text"
        value={localQuery}
        onChange={(event) => setLocalQuery(event.target.value)}
      />
      <br />
      <button
        onClick={() => dispatch({ type: "QuerySubmitted", query: localQuery })}
      >
        Submit
      </button>
    </div>
  );
};

const Chart: React.FC<{ results: QueryResults }> = ({ results }) => {
  return <div>Series: {results.series.map((s) => JSON.stringify(s))}</div>;
};

const Visualization: React.FC<{ results: QueryResults }> = ({ results }) => {
  return <Chart results={results} />;
};

export const PanelBuilder = () => {
  const [state, dispatch] = usePanelBuilderState();
  return (
    <div>
      <QueryInput query={state.query} dispatch={dispatch} />
      {state.resultState.type === "Success" && (
        <Visualization results={state.resultState.results} />
      )}
      {state.resultState.type === "Loading" && <span>Loading...</span>}
      {state.resultState.type === "Empty" && (
        <span>Run the query to see the data</span>
      )}
      {state.resultState.type === "Error" && (
        <span>{state.resultState.error}</span>
      )}
    </div>
  );
};
