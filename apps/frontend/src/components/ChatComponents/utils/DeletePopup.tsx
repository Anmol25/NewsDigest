import React, { useCallback, useState } from "react";
import { useAxios } from "../../../services/AxiosConfig";

type DeleteMode = "all" | "single";

interface DeletePopupProps {
	isOpen: boolean;
	mode: DeleteMode;
	sessionId?: string | null;
	onClose: () => void;
	onSuccess: (mode: DeleteMode, sessionId?: string | null) => void;
}

/**
 * Confirmation popup to delete chat history (all or single session).
 * Calls backend APIs and reports success to parent for state updates.
 */
const DeletePopup: React.FC<DeletePopupProps> = ({
	isOpen,
	mode,
	sessionId,
	onClose,
	onSuccess,
}) => {
	const axiosInstance = useAxios();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const title = mode === "all" ? "Delete all chats?" : "Delete this chat?";
	const description =
		mode === "all"
			? "This will permanently delete your entire chat history. This action cannot be undone."
			: "This will permanently delete this chat session and its messages. This action cannot be undone.";

	const handleConfirm = useCallback(async () => {
		if (loading) return;
		setLoading(true);
		setError(null);
		try {
			if (mode === "all") {
				await axiosInstance.delete("/chat_history");
				onSuccess("all", null);
			} else {
				if (!sessionId) throw new Error("Missing sessionId for single delete");
				await axiosInstance.delete("/chat_session", {
					params: { sessionId },
				});
				onSuccess("single", sessionId);
			}
			onClose();
		} catch (e: any) {
			const msg =
				e?.response?.data?.detail || e?.message || "Failed to delete chat(s).";
			setError(String(msg));
		} finally {
			setLoading(false);
		}
	}, [axiosInstance, loading, mode, onClose, onSuccess, sessionId]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40"
				onClick={() => !loading && onClose()}
			/>

			{/* Modal */}
			<div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white shadow-xl">
				<div className="px-6 pt-6 pb-4">
					<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
					<p className="mt-2 text-sm text-gray-600">{description}</p>
					{error && (
						<div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
							{error}
						</div>
					)}
				</div>
				<div className="flex items-center justify-end gap-3 px-6 pb-6">
					<button
						type="button"
						className="px-4 py-2 rounded-xl text-textSecondary hover:bg-gray-100 disabled:opacity-60"
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</button>
					<button
						type="button"
						className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60"
						onClick={handleConfirm}
						disabled={loading}
					>
						{loading ? "Deleting…" : "Delete"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeletePopup;

