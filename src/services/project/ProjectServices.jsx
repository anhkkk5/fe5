import { get, post, edit, del } from "../../utils/axios/request";
export const getProjectsByCandidate = async (candidateId) => {
  const result = await get(`projects`);
  return result;
};

export const createProject = async (options) => {
  const result = await post(`projects`, options);
  return result;
};

export const updateProject = async (id, options) => {
  const result = await edit(`projects/${id}`, options);
  return result;
};

export const deleteProject = async (id) => {
  const result = await del(`projects/${id}`);
  return result;
};