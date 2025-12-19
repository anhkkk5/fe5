import { get } from "../../utils/axios/request";
export const getLocation = async () => {
  const result = await get("locations");
  return result;
};
export const getLocationById = async (id) => {
  const result = await get(`locations/${id}`);
  return result;
};
