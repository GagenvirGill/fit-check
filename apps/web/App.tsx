import { BrowserRouter, Route, Routes } from "react-router-dom";
import Providers from "@/providers";
import Navbar from "@/components/nav/Navbar";
import Notifications from "@/components/notifications/Notifications";
import ProtectedRoute from "@/components/ProtectedRoute";
import Welcome from "@/views/Welcome";
import Closet from "@/views/Closet";
import AllItemsView from "@/views/AllItemsView";
import CategoryView from "@/views/CategoryView";
import OutfitsView from "@/views/OutfitsView";
import CreateView from "@/views/CreateView";

function AppShell() {
	return (
		<>
			<Navbar />
			<Notifications />
			<Routes>
				<Route path="/" element={<Welcome />} />
				<Route
					path="/closet"
					element={
						<ProtectedRoute>
							<Closet />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/closet/all"
					element={
						<ProtectedRoute>
							<AllItemsView />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/closet/:slug"
					element={
						<ProtectedRoute>
							<CategoryView />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/outfits"
					element={
						<ProtectedRoute>
							<OutfitsView />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/create"
					element={
						<ProtectedRoute>
							<CreateView />
						</ProtectedRoute>
					}
				/>
				<Route path="*" element={<Welcome />} />
			</Routes>
		</>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<Providers>
				<AppShell />
			</Providers>
		</BrowserRouter>
	);
}
