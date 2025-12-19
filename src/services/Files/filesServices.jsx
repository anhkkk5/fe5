import { postForm } from "../../utils/axios/request";

export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  return postForm("files/upload", form); // { url }
};
