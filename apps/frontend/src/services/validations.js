// Email validation
export const validateEmail = (email) => {
    if (!email) {
        return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    return '';
};

// Username validation
export const validateUsername = (username) => {
    if (!username) {
        return 'Username is required';
    }
    if (username.length < 3) {
        return 'Username must be at least 3 characters long';
    }
    return '';
};

// Password validation for new passwords
export const validateNewPassword = (password) => {
    if (!password) {
        return 'Password is required';
    }
    if (password.length < 8) {
        return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }
    if (!/\d/.test(password)) {
        return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Password must contain at least one special character';
    }
    return '';
};

// Simple password validation for login
export const validateLoginPassword = (password) => {
    if (!password) {
        return 'Password is required';
    }
    return '';
};

// Full name validation
export const validateFullName = (name) => {
    if (!name) {
        return 'Full name is required';
    }
    if (name.trim().length < 2) {
        return 'Full name must be at least 2 characters long';
    }
    if (!/^[a-zA-Z\s]*$/.test(name)) {
        return 'Full name can only contain letters and spaces';
    }
    return '';
};

// Form validation for Profile
export const validateProfileForm = (data) => {
    const errors = {
        fullname: validateFullName(data.fullname),
        email: validateEmail(data.email)
    };
    return {
        errors,
        isValid: !Object.values(errors).some(error => error !== '')
    };
};

// Form validation for Login
export const validateLoginForm = (data) => {
    const errors = {
        username: validateUsername(data.username),
        password: validateLoginPassword(data.password)
    };
    return {
        errors,
        isValid: !Object.values(errors).some(error => error !== '')
    };
};

// Form validation for Registration
export const validateRegistrationForm = (data) => {
    const errors = {
        fullname: validateFullName(data.fullname),
        email: validateEmail(data.email),
        username: validateUsername(data.username),
        password: validateNewPassword(data.password)
    };
    return {
        errors,
        isValid: !Object.values(errors).some(error => error !== '')
    };
};

// Password update validation
export const validatePasswordUpdate = (data) => {
    const errors = {
        oldPassword: data.oldPassword ? '' : 'Current password is required',
        newPassword: validateNewPassword(data.newPassword)
    };
    return {
        errors,
        isValid: !Object.values(errors).some(error => error !== '')
    };
};
