/**
 * Input validation middleware
 * Lightweight validation without extra dependencies
 */

/**
 * Validate candidate registration input
 */
export const validateCandidateRegistration = (req, res, next) => {
  const errors = [];
  const { firstName, lastName, email, phone, password } = req.body;

  if (!firstName || typeof firstName !== "string" || firstName.trim().length < 1) {
    errors.push("First name is required.");
  }
  if (!lastName || typeof lastName !== "string" || lastName.trim().length < 1) {
    errors.push("Last name is required.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required.");
  }
  if (!phone || !/^[0-9]{10,15}$/.test(phone.replace(/[\s\-+()]/g, ""))) {
    errors.push("Valid phone number is required (10-15 digits).");
  }
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // Sanitize
  req.body.firstName = firstName.trim();
  req.body.lastName = lastName.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phone = phone.trim();

  next();
};

/**
 * Validate candidate login input
 */
export const validateLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required.");
  }
  if (!password || password.length < 1) {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate HR login input
 */
export const validateHRLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  if (!email || email.trim().length < 1) {
    errors.push("Email is required.");
  }
  if (!password || password.length < 1) {
    errors.push("Password is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate drive creation/update
 */
export const validateDrive = (req, res, next) => {
  const errors = [];
  const { name, location } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 1) {
    errors.push("Drive name is required.");
  }
  if (!location || typeof location !== "string" || location.trim().length < 1) {
    errors.push("Location is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body.name = name.trim();
  req.body.location = location.trim();
  next();
};

/**
 * Validate exam creation
 */
export const validateExam = (req, res, next) => {
  const errors = [];
  const { title, duration, sections } = req.body;

  if (!title || typeof title !== "string" || title.trim().length < 1) {
    errors.push("Exam title is required.");
  }
  if (!duration || typeof duration !== "number" || duration < 1) {
    errors.push("Valid duration (in minutes) is required.");
  }
  if (!sections || !Array.isArray(sections) || sections.length < 1) {
    errors.push("At least one section is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body.title = title.trim();
  next();
};

/**
 * Validate schedule creation
 */
export const validateSchedule = (req, res, next) => {
  const errors = [];
  const { candidateIds, round, date } = req.body;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length < 1) {
    errors.push("At least one candidate is required.");
  }
  if (!round || !["R2", "R3", "R4"].includes(round)) {
    errors.push("Valid round (R2, R3, R4) is required.");
  }
  if (!date) {
    errors.push("Scheduled date is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
};

/**
 * Validate role creation
 */
export const validateRole = (req, res, next) => {
  const errors = [];
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Role name must be at least 2 characters.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body.name = name.trim();
  next();
};

/**
 * Validate user (admin) creation
 */
export const validateUserCreation = (req, res, next) => {
  const errors = [];
  const { name, email, password, roleId } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Valid email is required.");
  }
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }
  if (!roleId) {
    errors.push("Role is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validate MongoDB ObjectId parameter
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format.`,
      });
    }
    next();
  };
};
