import { get, post, edit, del } from "../../utils/axios/request";

export const getSkills = async () => {
  const result = await get("skills");
  return result;
};

export const createSkill = async (options) => {
  const result = await post("skills", options);
  return result;
};

export const updateSkill = async (id, options) => {
  const result = await edit(`skills/${id}`, options);
  return result;
};

export const deleteSkill = async (id) => {
  const result = await del(`skills/${id}`);
  return result;
};



