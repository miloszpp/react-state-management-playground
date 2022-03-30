import { map } from "rxjs";
import { ajax } from "rxjs/ajax";

const url = "http://localhost:3001";

export interface AnalyzeTask {
  id: number;
  status: "inProgress" | "cancelled" | "finished";
  result?: "positive" | "negative";
}

export const startAnalysis = (text: string) =>
  ajax
    .post(`${url}/analyze`, { message: text })
    .pipe(map((ajaxResponse) => ajaxResponse.response as AnalyzeTask));

export const getTaskStatus = (id: number) =>
  ajax.getJSON<AnalyzeTask>(`${url}/analyze/${id}`);

export const cancelTask = (id: number) =>
  ajax.post(`${url}/analyze/${id}/cancel`);
