import { get, post, edit, del } from "../../utils/axios/request";

export const getActivities = async () => {
  const result = await get("activities");
  return result;
};

export const createActivity = async (options) => {
  const result = await post("activities", options);
  return result;
};

export const updateActivity = async (id, options) => {
  const result = await edit(`activities/${id}`, options);
  return result;
};

export const deleteActivity = async (id) => {
  const result = await del(`activities/${id}`);
  return result;
};
