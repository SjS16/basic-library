import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAuthHeaders } from "../utils/csrf";

function Profile() {
  const currentUser = useCurrentUser();
  const [borrower, setBorrower] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [joinInvites, setJoinInvites] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinError, setJoinError] = useState("");

  const fetchMembership = () => {
    fetch("/membership_invites.json")
      .then((res) => (res.ok ? res.json() : { membership_invites: [] }))
      .then((data) => setJoinInvites(data.membership_invites || []))
      .catch(() => {});
    fetch("/membership_requests.json")
      .then((res) => (res.ok ? res.json() : { membership_requests: [] }))
      .then((data) => setJoinRequests(data.membership_requests || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (currentUser && !currentUser.borrower_id) fetchMembership();
  }, [currentUser]);

  const actOnInvite = async (id, action) => {
    setJoinError("");
    try {
      const res = await fetch(`/membership_invites/${id}/${action}.json`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setJoinError(data.error || "Something went wrong.");
        return;
      }
      if (action === "accept") {
        window.location.reload();
        return;
      }
      fetchMembership();
    } catch (err) {
      setJoinError("Something went wrong.");
    }
  };

  const askToJoin = async () => {
    setJoinError("");
    try {
      const res = await fetch("/membership_requests.json", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setJoinError(data.error || "Could not send the request.");
      fetchMembership();
    } catch (err) {
      setJoinError("Could not send the request.");
    }
  };

  const pendingInvite = joinInvites.find((i) => i.status === "pending");
  const myJoinRequest = joinRequests[0];

  useEffect(() => {
    if (currentUser?.borrower_id) {
      fetch(`/borrowers/${currentUser.borrower_id}.json`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setBorrower(data?.id ? data : null))
        .catch(() => setBorrower(null));
    }
  }, [currentUser]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (password !== passwordConfirmation) {
      setMessage({ type: "error", text: "The new password and its confirmation do not match." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/profile.json", {
        method: "PATCH",
        headers: { ...getAuthHeaders(), Accept: "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: "success", text: data.notice || "Password updated." });
        setCurrentPassword("");
        setPassword("");
        setPasswordConfirmation("");
      } else {
        setMessage({ type: "error", text: data.alert || "Something went wrong. Please try again." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return <p className="text-gray-600">Loading…</p>;
  }

  const labelClasses = "block text-sm font-medium mb-2 font-serif";
  const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent bg-white";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-black mb-6 sm:mb-8 text-amber-950">Your Profile</h1>

      <div className="bg-white rounded shadow p-6 mb-6">
        <dl className="space-y-5">
          <div>
            <dt className="text-sm text-gray-500">Email address</dt>
            <dd className="text-base font-medium mt-0.5">{currentUser.email_address}</dd>
          </div>

          {currentUser.name && (
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-base font-medium mt-0.5">{currentUser.name}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm text-gray-500">Account type</dt>
            <dd className="text-base font-medium mt-0.5">{currentUser.owner ? "Library owner" : "Member"}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-500">Member record</dt>
            {currentUser.borrower_id ? (
              borrower ? (
                <>
                  <dd className="text-base font-medium mt-0.5">{borrower.name} · Standing {borrower.standing}/100</dd>
                  <dd className="mt-1 text-sm">
                    <Link to={`/borrowers/${borrower.id}`} className="text-amber-800 underline hover:no-underline">
                      View my loans and reading list
                    </Link>
                  </dd>
                </>
              ) : (
                <dd className="text-base mt-0.5">Loading…</dd>
              )
            ) : (
              <dd className="text-base mt-0.5">Not a member of this library yet.</dd>
            )}
          </div>
        </dl>
      </div>

      {currentUser && !currentUser.borrower_id && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Library membership</h2>
          {pendingInvite ? (
            <>
              <p className="font-medium">You've been invited to join this library.</p>
              <p className="text-sm text-gray-600 mt-1">
                Accepting adds you as a member: you can request books and keep your own reading lists.
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => actOnInvite(pendingInvite.id, "accept")} className="px-4 py-2 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 font-medium">
                  Accept invite
                </button>
                <button onClick={() => actOnInvite(pendingInvite.id, "decline")} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">
                  Decline
                </button>
              </div>
            </>
          ) : myJoinRequest?.status === "pending" ? (
            <p className="text-gray-700">Your request to join is waiting for the owner's approval.</p>
          ) : (
            <>
              <p className="text-gray-700">
                You're not a member yet, so you can't request books or keep lists. Membership is
                granted by the owner, so the library stays within their circle.
              </p>
              {myJoinRequest?.status === "declined" && (
                <p className="text-sm text-red-700 mt-2">Your last request to join was declined. You can ask again.</p>
              )}
              <button onClick={askToJoin} className="mt-4 px-4 py-2 bg-amber-800 text-amber-50 rounded hover:bg-amber-900 font-medium">
                Ask to join this library
              </button>
            </>
          )}
          {joinError && <p className="text-sm text-red-700 mt-2">{joinError}</p>}
        </div>
      )}

      {currentUser.borrower_id && borrower && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Books you have borrowed</h2>
          {borrower.current_loans && borrower.current_loans.length > 0 ? (
            <ul className="space-y-3">
              {borrower.current_loans.map((loan) => {
                const overdue = new Date(loan.due_date) < new Date();
                return (
                  <li key={loan.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{loan.book.title}</p>
                      <p className="text-sm text-gray-600 truncate">{loan.book.author}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${overdue ? "bg-red-100 text-red-900 border-red-900" : "bg-amber-100 text-amber-900 border-amber-900"}`}>
                      {overdue ? "Overdue · " : "Due "}
                      {new Date(loan.due_date).toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-600">You don't have any books out right now.</p>
          )}
        </div>
      )}

      <div className="bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Change your password</h2>

        {message && (
          <div className={`rounded p-4 mb-4 ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="current_password" className={labelClasses}>Current password</label>
            <input
              id="current_password"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClasses}>New password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="password_confirmation" className={labelClasses}>Confirm new password</label>
            <input
              id="password_confirmation"
              type="password"
              required
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-amber-50 font-semibold rounded shadow transition-all disabled:opacity-50"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-3">Updating your password signs you out on your other devices.</p>
      </div>
    </div>
  );
}

export default Profile;
