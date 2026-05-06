
import { useState } from "react";
import { useAuth } from "@/providers/auth/useAuth";
import styles from "./ProfilePopup.module.css";

import ImgButton from "@/components/buttons/ImgButton";
import InlineContextMenuButton from "@/components/buttons/InlineContextMenuButton";

const ProfilePopup = () => {
	const [isPopupVisible, setPopupVisibility] = useState(false);
	const { user, logout } = useAuth();

	const handleButtonChange = () => {
		setPopupVisibility(!isPopupVisible);
	};

	const handleLogout = (e) => {
		e.preventDefault();
		setPopupVisibility(false);
		void logout();
	};

	return (
		<div className={styles.popupContainer}>
			<ImgButton
				buttonId="profile-popup-button"
				imgFileName="/profile_icon.png"
				onChange={handleButtonChange}
			/>

			{isPopupVisible && (
				<div className={styles.popupContent}>
					<p className={styles.emailText}>
						{user?.email ?? "You are not Logged in"}
					</p>
					<InlineContextMenuButton
						texts={["Logout"]}
						onClicks={[handleLogout]}
					/>
				</div>
			)}
		</div>
	);
};

export default ProfilePopup;
