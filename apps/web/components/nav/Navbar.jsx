
import React from "react";
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";
import ProfilePopup from "./profilePopup/ProfilePopup";

const Navbar = () => {
	return (
		<nav className={styles.navbar}>
			<Link to="/outfits">
				<img
					src="/calendar_icon.png"
					alt="past-outfits"
					className={styles.navLogo}
				/>
			</Link>
			<Link to="/closet">
				<img
					src="/hanger_icon.png"
					alt="closet"
					className={styles.navLogo}
				/>
			</Link>
			<Link to="/">
				<img
					src="/house_icon.png"
					alt="Home"
					className={styles.navLogo}
				/>
			</Link>
			<Link to="/create">
				<img
					src="/plus_icon.png"
					alt="Create"
					className={styles.navLogo}
				/>
			</Link>
			<ProfilePopup />
		</nav>
	);
};

export default Navbar;
