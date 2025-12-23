import { get, post, edit, del } from "../../utils/axios/request";

export const getReferences = async () => {
  const result = await get("references");
  return result;
};

export const createReference = async (options) => {
  const result = await post("references", options);
  return result;
};

export const updateReference = async (id, options) => {
  const result = await edit(`references/${id}`, options);
  return result;
};

export const deleteReference = async (id) => {
  const result = await del(`references/${id}`);
  return result;
};





