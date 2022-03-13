import { QueryResults } from "./state";

export const fetchPanelData = (query: string): Promise<QueryResults> => {
  console.log("Fetching panel data");
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          series: [
            [
              { x: 0, y: 1 },
              { x: 1, y: 2 },
              { x: 2, y: 1 },
            ],
          ],
        }),
      1000
    )
  );
};
