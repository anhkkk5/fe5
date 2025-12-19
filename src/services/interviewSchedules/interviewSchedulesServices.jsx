import { get, post, edit, del } from "../../utils/axios/request";

export const getCompanyApprovedApplications = async () => {
  return await get("interview-schedules/company/approved-applications");
};

export const getCompanyInterviewSchedules = async () => {
  return await get("interview-schedules/company");
};

export const createInterviewSchedule = async (payload) => {
  return await post("interview-schedules", payload);
};

export const rescheduleInterview = async (id, payload) => {
  return await edit(`interview-schedules/${id}/reschedule`, payload);
};

export const getMyInterviewSchedules = async () => {
  return await get("interview-schedules/my");
};

export const confirmInterview = async (id, payload) => {
  return await edit(`interview-schedules/${id}/confirm`, payload);
};

export const requestRescheduleInterview = async (id, payload) => {
  return await edit(`interview-schedules/${id}/request-reschedule`, payload);
};

export const deleteInterviewSchedule = async (id) => {
  return await del(`interview-schedules/${id}`);
};
