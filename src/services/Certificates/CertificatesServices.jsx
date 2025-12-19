import { get, post, edit, del } from "../../utils/axios/request";
export const getCertificatesByCandidate = async () => {
  const result = await get(`certificates`);
  return result;
};

export const createCertificate = async (options) => {
  const result = await post(`certificates`, options);
  return result;
};

export const updateCertificate = async (id, options) => {
  const result = await edit(`certificates/${id}`, options);
  return result;
};

export const deleteCertificate = async (id) => {
  const result = await del(`certificates/${id}`);
  return result;
};
