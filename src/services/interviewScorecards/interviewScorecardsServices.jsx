import { get, post } from "../../utils/axios/request";

export const upsertScorecard = async (scheduleId, payload) => {
  return await post(`interview-scorecards/${scheduleId}`, payload);
};

export const getMyScorecards = async () => {
  return await get("interview-scorecards/my");
};

export const getScorecardBySchedule = async (scheduleId) => {
  return await get(`interview-scorecards/${scheduleId}`);
};
