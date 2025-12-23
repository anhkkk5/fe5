import { get, post, edit, del, editForm } from "../../utils/axios/request";
import { getCookie } from "../../helpers/cookie";
import { decodeJwt } from "../auth/authServices";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "number") return String(value);
  return `${value}`.trim();
};

const fetchCandidateById = async (candidateId) => {
  const normalized = normalizeId(candidateId);
  if (!normalized) return null;
  const tryPaths = [`candidates/${normalized}`, `Candidates/${normalized}`];
  let lastError;
  for (const path of tryPaths) {
    try {
      return await get(path);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return null;
};

// Backend uses authenticated user context for candidate profile
export const getMyCandidateProfile = async () => {
  try {
    const result = await get("candidates/me");
    return result;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404) {
      return null;
    }
    if (status !== 401 && status !== 403) throw error;

    let candidateId = getCookie("id");
    if (!candidateId) {
      const token = getCookie("token") || localStorage.getItem("token");
      if (token) {
        const payload = decodeJwt(token);
        candidateId = payload?.sub || payload?.id || "";
      }
    }
    if (!candidateId) throw error;
    return await fetchCandidateById(candidateId);
  }
};

export const getAllCandidates = async () => {
  const result = await get("candidates");
  return result;
};

export const createMyCandidateProfile = async (options) => {
  const result = await post("candidates/me", options);
  return result;
};

export const updateMyCandidateProfile = async (options) => {
  try {
    const result = await edit("candidates/me", options);
    return result;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404) {
      const payload = {
        fullName: options?.fullName || options?.name || "Chưa cập nhật",
        email: options?.email,
        phone: options?.phone,
        dob: options?.dob,
        gender: options?.gender,
        address: options?.address,
        introduction: options?.introduction,
      };
      return await createMyCandidateProfile(payload);
    }
    throw error;
  }
};

export const updateIntroduction = async (intro) => {
  try {
    const result = await edit("candidates/me", { introduction: intro });
    return result;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404) {
      return await createMyCandidateProfile({
        fullName: "Chưa cập nhật",
        introduction: intro,
      });
    }
    throw error;
  }
};

import { uploadImage, deleteImage } from "../Cloudinary/cloudinaryServices";

export const uploadMyAvatar = async (file) => {
  try {
    // Upload ảnh lên Cloudinary
    const uploadResult = await uploadImage(file, "avatars");

    // Lấy URL từ kết quả upload
    const avatarUrl =
      uploadResult?.secure_url ||
      uploadResult?.url ||
      uploadResult?.data?.secure_url ||
      uploadResult?.data?.url;

    if (!avatarUrl) {
      throw new Error("Không nhận được URL ảnh từ Cloudinary");
    }

    // Cập nhật URL ảnh vào candidate profile
    const updateResult = await updateMyCandidateProfile({ avatar: avatarUrl });

    return {
      avatarUrl: avatarUrl,
      publicId: uploadResult?.public_id || uploadResult?.data?.public_id,
      ...updateResult,
    };
  } catch (error) {
    console.error("Upload avatar error:", error);
    throw error;
  }
};

export const uploadMyAvatarViaApi = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const result = await editForm("candidates/me/avatar", formData);
  return result;
};

export const deleteMyAvatar = async () => {
  try {
    // Lấy thông tin candidate hiện tại để lấy publicId của ảnh cũ
    const candidate = await getMyCandidateProfile();
    const avatarUrl = candidate?.avatar;

    // Nếu có avatar URL từ Cloudinary, extract publicId và xóa
    if (avatarUrl && avatarUrl.includes("cloudinary.com")) {
      try {
        // Extract public_id từ URL Cloudinary
        // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/v{version}/{folder}/{filename}.{ext}
        // Hoặc: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{filename}.{ext}
        const urlParts = avatarUrl.split("/");
        const uploadIndex = urlParts.findIndex((part) => part === "upload");

        if (uploadIndex !== -1 && urlParts.length > uploadIndex + 1) {
          // Lấy phần sau "upload/"
          let afterUpload = urlParts.slice(uploadIndex + 1).join("/");

          // Bỏ version nếu có (v1234567890)
          afterUpload = afterUpload.replace(/^v\d+\//, "");

          // Bỏ extension
          const publicId = afterUpload.replace(/\.[^/.]+$/, "");

          if (publicId) {
            await deleteImage(publicId);
          }
        }
      } catch (deleteError) {
        console.warn("Could not delete image from Cloudinary:", deleteError);
        // Tiếp tục xóa avatar trong profile dù có lỗi xóa trên Cloudinary
      }
    }

    // Xóa avatar URL khỏi candidate profile
    const result = await updateMyCandidateProfile({ avatar: null });
    return result;
  } catch (error) {
    console.error("Delete avatar error:", error);
    throw error;
  }
};

export const uploadTemplateAvatar = async (templateId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const result = await editForm(
    `candidates/me/template-avatar/${templateId}`,
    formData
  );
  return result;
};

export const loginCandidates = async (email, password = "") => {
  // Query by email only, password will be checked on client side
  const result = await get(`Candidates?email=${email}`);
  return result;
};

export const checkExist = async (key, value) => {
  const result = await get(`candidates?${key}=${value}`);
  return result;
};

export const deleteCandidates = async (id) => {
  const result = await del(`candidates/${id}`);
  return result;
};

export const editCandidates = async (id, options) => {
  const result = await edit(`candidates/${id}`, options);
  return result;
};
