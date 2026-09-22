const Complaint = require("../../models/Complaint");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

const submitComplaint = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;
    const complaint = await Complaint.create({
      user: req.user._id,
      title,
      description,
      category: category || "other",
    });

    return sendSuccess(res, "Complaint submitted successfully", { complaint }, 201);
  } catch (error) {
    next(error);
  }
};

const getComplaintList = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      query = { user: req.user._id };
    }

    const complaints = await Complaint.find(query)
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Complaints fetched successfully", { complaints }, 200);
  } catch (error) {
    next(error);
  }
};

const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId).populate("user", "name email role");
    if (!complaint) {
      return sendError(res, "Complaint not found", 404);
    }

    const isOwner = String(complaint.user._id) === String(req.user._id);
    if (!isOwner && req.user.role !== "admin") {
      return sendError(res, "You cannot view this complaint", 403);
    }

    return sendSuccess(res, "Complaint fetched successfully", { complaint }, 200);
  } catch (error) {
    next(error);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, adminNote = "" } = req.body;
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return sendError(res, "Complaint not found", 404);
    }

    complaint.status = status;
    complaint.adminNote = adminNote;
    await complaint.save();

    return sendSuccess(res, "Complaint status updated", { complaint }, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitComplaint,
  getComplaintList,
  getComplaintById,
  updateComplaintStatus,
};
