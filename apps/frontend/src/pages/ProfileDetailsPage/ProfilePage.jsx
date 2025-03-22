import "./ProfilePage.css"
import edit from "../../assets/Icons/edit.svg"
import key from "../../assets/Icons/key.svg"
import trash from "../../assets/Icons/trash.svg"
import { useAxios } from "../../services/AxiosConfig";
import { useEffect, useState } from "react";


function ProfilePage(){
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
    const [passwordError, setPasswordError] = useState('');

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

    const handleEditToggle = () => {
        if (isEditing) {
            setUserData(originalData);
        }
        setIsEditing(!isEditing);
    };

    const handleUpdateProfile = async () => {
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
            console.error("Failed to update profile:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
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

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        if (name === 'oldPassword') {
            setPasswordError('');
        }
    };

    const handleUpdatePassword = async () => {
        try {
            const response = await axiosInstance.post("/updatepassword", {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            if (response.status === 200) {
                setIsUpdatingPassword(false);
                setPasswordData({ oldPassword: '', newPassword: '' });
                setPasswordError('');
            }
        } catch (error) {
            if (error.response?.status === 400) {
                setPasswordError('Incorrect current password');
            } else {
                console.error("Failed to update password:", error);
            }
        }
    };

    return (
        <div className="ProfilePageContainer">
            <h1 className="PageTitle">Account Settings</h1>
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
                                className="ProfileInput"
                            />
                        </div>
                        <div className="InfoItem">
                            <label>Email</label>
                            <input
                                name="email"
                                type="email"
                                value={userData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="ProfileInput"
                            />
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
                            <button 
                                className="IconButton" 
                                onClick={() => {
                                    if (isUpdatingPassword) {
                                        setPasswordData({ oldPassword: '', newPassword: '' });
                                    }
                                    setIsUpdatingPassword(!isUpdatingPassword);
                                }}
                            >
                                <img src={key} alt="Key" className="ButtonIcon" />
                                {isUpdatingPassword ? 'Cancel' : 'Update Password'}
                            </button>
                            {isUpdatingPassword && (
                                <button 
                                    className="IconButton UpdateButton" 
                                    onClick={handleUpdatePassword}
                                >
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
                                        onChange={handlePasswordChange}
                                        className={`ProfileInput ${passwordError ? 'ErrorInput' : ''}`}
                                        placeholder="Enter current password"
                                    />
                                    {passwordError && (
                                        <span className="ErrorMessage">{passwordError}</span>
                                    )}
                                </div>
                                <div className="InfoItem">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="ProfileInput"
                                        placeholder="Enter new password"
                                    />
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
                            <button 
                                className="IconButton" 
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="DangerButton" 
                                onClick={handleDeleteAccount}
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProfilePage;