import "./Profile.css"
import edit from "../../assets/Icons/edit.svg"
import key from "../../assets/Icons/key.svg"
import trash from "../../assets/Icons/trash.svg"
import { useAxios } from "../../services/AxiosConfig";
import { useEffect, useState } from "react";
import { validateProfileForm, validatePasswordUpdate } from '../../services/validations';

function Profile(){
    const axiosInstance = useAxios();
    const [userData, setUserData] = useState({
        username: "",
        fullname: "",
        email: ""
    });
    const [isEditing, setIsEditing] = useState(false);
    const [originalData, setOriginalData] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: ''
    });
    const [errors, setErrors] = useState({
        fullname: '',
        email: '',
        newPassword: '',
        emailExists: '',
        currentPassword: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            const response = await axiosInstance("/getuser");
            if (response.status === 200) {
                setUserData(response.data);
                setOriginalData(response.data);
            }
        };
        fetchUser();
    }, []);

    const clearErrors = (field) => {
        setErrors(prev => ({
            ...prev,
            [field]: '',
            emailExists: field === 'email' ? '' : prev.emailExists,
            currentPassword: field === 'oldPassword' ? '' : prev.currentPassword
        }));
    };

    const handleEditToggle = () => {
        if (isEditing) {
            setUserData(originalData);
            setErrors(prev => ({ ...prev, emailExists: '', email: '', fullname: '' }));
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const trimmedValue = value.replace(/^\s+/g, '');
        
        if (name === 'oldPassword' || name === 'newPassword') {
            setPasswordData(prev => ({
                ...prev,
                [name]: trimmedValue
            }));
        } else {
            setUserData(prev => ({
                ...prev,
                [name]: trimmedValue
            }));
        }
        clearErrors(name);
    };

    const handleUpdateProfile = async () => {
        const { errors: validationErrors, isValid } = validateProfileForm(userData);
        setErrors(prev => ({ 
            ...prev, 
            ...validationErrors,
            emailExists: '' 
        }));

        if (!isValid) return;

        try {
            const { fullname, email } = userData;
            const response = await axiosInstance.post("/updateprofile", {
                fullname,
                email
            });

            if (response.status === 200) {
                setOriginalData(userData);
                setIsEditing(false);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                setErrors(prev => ({ ...prev, emailExists: 'Email already exists' }));
            } else {
                console.error("Failed to update profile:", error);
            }
        }
    };

    const handleUpdatePassword = async () => {
        const { errors: validationErrors, isValid } = validatePasswordUpdate(passwordData);
        setErrors(prev => ({ 
            ...prev, 
            ...validationErrors,
            currentPassword: '' 
        }));

        if (!isValid) return;

        try {
            const response = await axiosInstance.post("/updatepassword", passwordData);

            if (response.status === 200) {
                setIsUpdatingPassword(false);
                setPasswordData({ oldPassword: '', newPassword: '' });
                setErrors(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
            }
        } catch (error) {
            if (error.response?.status === 400) {
                setErrors(prev => ({ ...prev, currentPassword: 'Incorrect current password' }));
                setPasswordData(prev => ({ ...prev, oldPassword: '' }));
            } else {
                console.error("Failed to update password:", error);
            }
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const response = await axiosInstance.get("/deleteaccount");
            if (response.status === 200) {
                window.location.href = "/login";
            }
        } catch (error) {
            console.error("Failed to delete account:", error);
        }
    };

    const togglePasswordUpdate = () => {
        setIsUpdatingPassword(!isUpdatingPassword);
        if (isUpdatingPassword) {
            setPasswordData({ oldPassword: '', newPassword: '' });
            setErrors(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        }
    };

    return (
        <div className="ProfilePageContainer">
            <h1 className="PageTitle">Profile Settings</h1>
            <div className="ProfilePageMainContainer">
                <div className="ProfileSection">
                    <div className="ProfileHeadingsContainer">
                        <div className="HeadingWrapper">
                            <p className="ProfileHeading">Profile Details</p>
                            <span className="HeadingDescription">Manage your personal information</span>
                        </div>
                        <div className="ButtonGroup">
                            <button className="IconButton" onClick={handleEditToggle}>
                                <img src={edit} alt="Edit" className="ButtonIcon" />
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                            {isEditing && (
                                <button className="IconButton UpdateButton" onClick={handleUpdateProfile}>
                                    Update Profile
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="InfoGrid">
                        <div className="InfoItem">
                            <label>Username</label>
                            <p className="ProfileText">{userData.username}</p>
                        </div>
                        <div className="InfoItem">
                            <label>Full Name</label>
                            <input
                                name="fullname"
                                type="text"
                                value={userData.fullname}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`ProfileInput ${errors.fullname ? 'ErrorInput' : ''}`}
                            />
                            {errors.fullname && <span className="ErrorMessage">{errors.fullname}</span>}
                        </div>
                        <div className="InfoItem">
                            <label>Email</label>
                            <input
                                name="email"
                                type="email"
                                value={userData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`ProfileInput ${errors.email || errors.emailExists ? 'ErrorInput' : ''}`}
                            />
                            {errors.email && <span className="ErrorMessage">{errors.email}</span>}
                            {errors.emailExists && <span className="ErrorMessage">{errors.emailExists}</span>}
                        </div>
                    </div>
                </div>

                <div className="ProfileSection">
                    <div className="ProfileHeadingsContainer">
                        <div className="HeadingWrapper">
                            <p className="ProfileHeading">Security</p>
                            <span className="HeadingDescription">Manage your password and security settings</span>
                        </div>
                        <div className="ButtonGroup">
                            <button className="IconButton" onClick={togglePasswordUpdate}>
                                <img src={key} alt="Key" className="ButtonIcon" />
                                {isUpdatingPassword ? 'Cancel' : 'Update Password'}
                            </button>
                            {isUpdatingPassword && (
                                <button className="IconButton UpdateButton" onClick={handleUpdatePassword}>
                                    Confirm Update
                                </button>
                            )}
                        </div>
                    </div>
                    {isUpdatingPassword ? (
                        <div className="PasswordUpdateForm">
                            <div className="InfoGrid">
                                <div className="InfoItem">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        name="oldPassword"
                                        value={passwordData.oldPassword}
                                        onChange={handleInputChange}
                                        className={`ProfileInput ${errors.currentPassword ? 'ErrorInput' : ''}`}
                                        placeholder="Enter current password"
                                    />
                                    {errors.currentPassword && (
                                        <span className="ErrorMessage">{errors.currentPassword}</span>
                                    )}
                                </div>
                                <div className="InfoItem">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handleInputChange}
                                        className={`ProfileInput ${errors.newPassword ? 'ErrorInput' : ''}`}
                                        placeholder="Enter new password"
                                    />
                                    {errors.newPassword && <span className="ErrorMessage">{errors.newPassword}</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="SecurityTip">
                            We recommend changing your password every 3 months for better security.
                        </p>
                    )}
                </div>

                <div className="ProfileSection">
                    <div className="ProfileHeadingsContainer">
                        <div className="HeadingWrapper">
                            <p className="ProfileHeading">Delete Account</p>
                            <span className="HeadingDescription">Permanently delete your account and all data</span>
                        </div>
                        <button className="DangerButton" onClick={() => setShowDeleteModal(true)}>
                            <img src={trash} alt="Trash" className="ButtonIcon" />
                            Delete Account
                        </button>
                    </div>
                    <p className="WarningText">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
            </div>

            {showDeleteModal && (
                <div className="ModalOverlay">
                    <div className="ModalContent">
                        <h2>Delete Account</h2>
                        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                        <div className="ModalButtons">
                            <button className="IconButton" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="DangerButton" onClick={handleDeleteAccount}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;