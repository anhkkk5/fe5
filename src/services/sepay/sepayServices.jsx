import { get, post } from "../../utils/axios/request";

export const createSepayTopup = async (stars) => {
  const result = await post("sepay/topup", { stars });
  return result;
};

export const getSepayTopupStatus = async (id) => {
  const result = await get(`sepay/topup/${id}`);
  return result;
};
