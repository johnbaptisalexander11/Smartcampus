const { sendError } = require("../utils/apiResponse");

const validateCreateGroup = (req, res, next) => {
  const { name, subject, maxMembers, location, sessionTime, targetStudyYear, targetSemester } = req.body;
  if (
    !name ||
    !subject ||
    !location ||
    maxMembers === undefined ||
    sessionTime === undefined ||
    targetStudyYear === undefined ||
    targetSemester === undefined
  ) {
    return sendError(
      res,
      "name, subject, location, maxMembers, sessionTime, targetStudyYear, and targetSemester are required",
      400
    );
  }

  const parsedMax = Number(maxMembers);
  if (!Number.isFinite(parsedMax) || parsedMax < 1) {
    return sendError(res, "maxMembers must be a number >= 1", 400);
  }

  const parsedTime = new Date(sessionTime);
  if (Number.isNaN(parsedTime.getTime())) {
    return sendError(res, "sessionTime must be a valid date/time", 400);
  }

  const parsedYear = Number(targetStudyYear);
  if (!Number.isFinite(parsedYear) || parsedYear < 1 || parsedYear > 4) {
    return sendError(res, "targetStudyYear must be a number between 1 and 4", 400);
  }

  const parsedSemester = Number(targetSemester);
  if (!Number.isFinite(parsedSemester) || (parsedSemester !== 1 && parsedSemester !== 2)) {
    return sendError(res, "targetSemester must be 1 or 2", 400);
  }
  next();
};

const validateCreateTask = (req, res, next) => {
  const { title } = req.body;
  if (!title) {
    return sendError(res, "task title is required", 400);
  }
  next();
};

const validateCreateNote = (req, res, next) => {
  const { title } = req.body;
  if (!title) {
    return sendError(res, "note title is required", 400);
  }
  next();
};

const validateGroupFeedback = (req, res, next) => {
  const { type, message } = req.body;
  if (!type || !["feedback", "complaint"].includes(type)) {
    return sendError(res, "type must be either feedback or complaint", 400);
  }
  if (!message || !String(message).trim()) {
    return sendError(res, "message is required", 400);
  }
  next();
};

const validateCreateOnlineMeeting = (req, res, next) => {
  const { scheduledAt } = req.body;
  if (scheduledAt !== undefined && scheduledAt !== null && scheduledAt !== "") {
    const parsed = new Date(scheduledAt);
    if (Number.isNaN(parsed.getTime())) {
      return sendError(res, "scheduledAt must be a valid date/time", 400);
    }
  }
  next();
};

module.exports = {
  validateCreateGroup,
  validateCreateTask,
  validateCreateNote,
  validateGroupFeedback,
  validateCreateOnlineMeeting,
};
