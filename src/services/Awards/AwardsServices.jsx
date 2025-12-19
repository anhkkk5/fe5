import { get, post, edit, del } from "../../utils/axios/request";

export const getAwards = async () => {
  const result = await get("awards");
  return result;
};

export const createAward = async (options) => {
  const result = await post("awards", options);
  return result;
};

export const updateAward = async (id, options) => {
  const result = await edit(`awards/${id}`, options);
  return result;
};

export const deleteAward = async (id) => {
  const result = await del(`awards/${id}`);
  return result;
};
