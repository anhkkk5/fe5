import { get, post, edit, del } from "../../utils/axios/request";

export const getHobbies = async () => {
  const result = await get("hobbies");
  return result;
};

export const createHobby = async (options) => {
  const result = await post("hobbies", options);
  return result;
};

export const updateHobby = async (id, options) => {
  const result = await edit(`hobbies/${id}`, options);
  return result;
};

export const deleteHobby = async (id) => {
  const result = await del(`hobbies/${id}`);
  return result;
};



