import { get, post, edit } from "../../utils/axios/request";

export const getMyStars = async () => {
  const result = await get("stars/me");
  return result;
};

export const upgradeAccountByStars = async (cost) => {
  const result = await post("stars/upgrade", { cost });
  return result;
};

export const adminAdjustCandidateStars = async (candidateId, amount) => {
  const result = await edit(`stars/admin/candidates/${candidateId}`, { amount });
  return result;
};

export const adminAdjustCompanyStars = async (companyId, amount) => {
  const result = await edit(`stars/admin/companies/${companyId}`, { amount });
  return result;
};
