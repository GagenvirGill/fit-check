
import { Link } from "react-router-dom";
import styles from "./Navbar.module.css";
import ProfilePopup from "./profilePopup/ProfilePopup";
import calendarIcon from "@/assets/icons/calendar.svg";
import hangerIcon from "@/assets/icons/hanger.svg";
import homeIcon from "@/assets/icons/home.svg";
import plusIcon from "@/assets/icons/plus.svg";

const Navbar = () => {
	return (
		<nav className={styles.navbar}>
			<Link to="/outfits">
				<img
					src={calendarIcon}
					alt="past-outfits"
					className={styles.navLogo}
				/>
			</Link>
			<Link to="/closet">
				<img
					src={hangerIcon}
					alt="closet"
					className={styles.navLogo}
				/>
			</Link>
			<Link to="/">
				<img
					src={homeIcon}
					alt="Home"
					className={styles.navLogo}
				/>
			</Link>
			<Link to="/create">
				<img
					src={plusIcon}
					alt="Create"
					className={styles.navLogo}
				/>
			</Link>
			<ProfilePopup />
		</nav>
	);
};

export default Navbar;
