import { get, post } from "../../utils/axios/request";

export const createMomoPayment = async ({ purpose, amount, jobCredits, orderInfo }) => {
  const payload = { purpose, amount, jobCredits, orderInfo };
  return await post("payments/momo/create", payload);
};

export const getPaymentStatus = async (orderId) => {
  return await get(`payments/status/${orderId}`);
};
