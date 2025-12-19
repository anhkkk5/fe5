import { get } from "../../utils/axios/request";

export const getListCity = async () => {
  const result = await get("city");
  return result;
};
