import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAuthHeaders } from "../utils/csrf";

// In-app notifications, shown at the top of every page until
// dismissed: a wished-for book arriving for members, a new member
// joining for the owner. Dismissing deletes the notification.
function NotificationsBanner() {
  const currentUser = useCurrentUser();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    fetch("/notifications.json")
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
  }, [currentUser]);

  const dismiss = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/notifications/${id}.json`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
    } catch (err) {
      // Already hidden here; a reload would show the true state.
    }
  };

  if (!currentUser || notifications.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="flex-1 text-sm text-blue-900">
            {n.kind === "wishlist_book_arrived" && n.book ? (
              <>
                📚{" "}
                <Link to={`/books/${n.book.id}`} className="font-semibold underline hover:no-underline">
                  {n.book.title}
                </Link>{" "}
                from your want-to-read list is now in the library.
              </>
            ) : n.kind === "member_joined" && n.borrower ? (
              <>
                👋{" "}
                <Link to={`/borrowers/${n.borrower.id}`} className="font-semibold underline hover:no-underline">
                  {n.borrower.name}
                </Link>{" "}
                just joined your library.
              </>
            ) : (
              "You have a new notification."
            )}
          </p>
          <button
            onClick={() => dismiss(n.id)}
            className="text-blue-900 hover:text-blue-950 font-bold leading-none flex-shrink-0"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationsBanner;
