import ApiError from './ApiError.js';

// Validate required fields are not empty
export const validateRequiredFields = (fields, fieldNames) => {
  // Check if all required fields are provided
  for (let i = 0; i < fields.length; i++) {
    if (!fields[i]) {
      throw new ApiError(400, `All fields (${fieldNames.join(', ')}) are required.`);
    }
  }

  // Check if fields are not empty after trimming
  if (fields.some((field) => field?.trim() === "")) {
    throw new ApiError(400, `All fields must not be empty.`);
  }
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new ApiError(400, `Please provide a valid email address.`);
  }
};

// Validate username format
export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username.trim())) {
    throw new ApiError(400, `Username must be 3-20 characters long and contain only letters, numbers, and underscores.`);
  }
};

// Validate password strength
export const validatePassword = (password) => {
  if (password.trim().length < 6) {
    throw new ApiError(400, `Password must be at least 6 characters long.`);
  }
};

// Validate full name
export const validateFullName = (fullName) => {
  if (fullName.trim().length < 2 || fullName.trim().length > 50) {
    throw new ApiError(400, `Full name must be between 2 and 50 characters long.`);
  }
};
