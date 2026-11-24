import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuthHeaders } from "../../utils/csrf";
import Pagination from "../Pagination";

const BORROWERS_PER_PAGE = 20;

function BorrowersList() {
  const [borrowers, setBorrowers] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch("/borrowers.json")
      .then((res) => res.json())
      .then((data) => setBorrowers(data))
      .catch((err) => console.error("Error fetching borrowers:", err));
  }, [location.key]);

  const [inviteToken, setInviteToken] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState(null);
  const [sentInvites, setSentInvites] = useState([]);
  const [copied, setCopied] = useState(false);

  const fetchInvites = () => {
    fetch("/invite_link.json")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setInviteToken(data.token || ""))
      .catch(() => {});
    fetch("/membership_invites.json")
      .then((res) => (res.ok ? res.json() : { membership_invites: [] }))
      .then((data) => setSentInvites(data.membership_invites || []))
      .catch(() => {});
  };

  useEffect(fetchInvites, []);

  const inviteUrl = inviteToken ? `${window.location.origin}/registration/new?invite=${inviteToken}` : "";
  const pendingInvites = sentInvites.filter((i) => i.status === "pending");

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setInviteMessage({ type: "error", text: "Copy failed. Select the link text and copy it manually." });
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Regenerate the invite link? The old link will stop working everywhere you shared it.")) return;
    try {
      const res = await fetch("/invite_link/regenerate.json", { method: "POST", headers: getAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInviteToken(data.token || "");
        setInviteMessage({ type: "success", text: "New invite link created. The old one no longer works." });
      }
    } catch (err) {
      setInviteMessage({ type: "error", text: "Could not regenerate the link." });
    }
  };

  const handleEmailInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteMessage(null);
    try {
      const res = await fetch("/membership_invites.json", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInviteMessage({ type: "success", text: `Invite sent to ${inviteEmail.trim()}. It will be waiting in their Profile.` });
        setInviteEmail("");
        fetchInvites();
      } else {
        setInviteMessage({ type: "error", text: data.error || "Could not send the invite." });
      }
    } catch (err) {
      setInviteMessage({ type: "error", text: "Could not send the invite." });
    }
  };

  const handleDelete = (borrower) => {
    if (!window.confirm(`Remove ${borrower.name} from the library? Their reading lists and loan history will be deleted too. This can't be undone.`)) return;
    fetch(`/borrowers/${borrower.id}.json`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
      .then(async (res) => {
        if (res.ok) {
          setBorrowers(borrowers.filter((b) => b.id !== borrower.id));
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Could not remove this member.");
        }
      })
      .catch(() => alert("Could not remove this member."));
  };

  const getStandingColor = (standing) => {
    if (standing >= 90) return "green";
    if (standing >= 70) return "blue";
    if (standing >= 50) return "yellow";
    if (standing >= 30) return "orange";
    return "red";
  };

  const getStandingBadge = (standing) => {
    const color = getStandingColor(standing);
    const colorClasses = {
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      red: "bg-red-100 text-red-800",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colorClasses[color]}`}>
        {standing}/100
      </span>
    );
  };

  const totalPages = Math.ceil(borrowers.length / BORROWERS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const pageBorrowers = borrowers.slice((currentPage - 1) * BORROWERS_PER_PAGE, currentPage * BORROWERS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Borrowers</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage library members and their loan status</p>
          </div>
          <button
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-amber-800 to-amber-900 text-amber-50 rounded-lg hover:from-amber-900 hover:to-amber-950 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            onClick={() => navigate("/borrowers/new")}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Borrower</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-l-4 border-amber-900">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Borrowers</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{borrowers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-l-4 border-amber-700">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Excellent Standing</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700">
              {borrowers.filter((b) => b.standing >= 90).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-l-4 border-amber-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Fair Standing</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600">
              {borrowers.filter((b) => b.standing >= 50 && b.standing < 70).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-5 border-l-4 border-red-600">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Restricted</p>
            <p className="text-2xl sm:text-3xl font-bold text-red-600">
              {borrowers.filter((b) => b.standing < 50).length}
            </p>
          </div>
        </div>
      </div>

      {/* Invite People */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 border-l-4 border-amber-900">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Invite people</h2>
        <p className="text-sm text-gray-600 mb-4">
          Membership is by invitation, so the library stays within your circle. Share the link
          with someone new, or invite an existing account by email.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Invite link</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
            <div className="flex gap-2">
              <button onClick={handleCopyLink} className="px-4 py-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 text-sm font-medium">
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button onClick={handleRegenerate} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Regenerate
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Anyone who signs up through this link becomes a member automatically. Regenerating kills the old link everywhere it was shared.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Invite by email (existing accounts)</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <button onClick={handleEmailInvite} disabled={!inviteEmail.trim()} className="px-4 py-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 text-sm font-medium disabled:bg-gray-300">
              Send invite
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">They accept from their Profile page. No account with that email yet? Send them the invite link instead.</p>
        </div>

        {inviteMessage && (
          <p className={`text-sm mt-3 ${inviteMessage.type === "success" ? "text-green-700" : "text-red-700"}`}>
            {inviteMessage.text}
          </p>
        )}

        {pendingInvites.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Waiting for acceptance</p>
            <ul className="space-y-1">
              {pendingInvites.map((invite) => (
                <li key={invite.id} className="text-sm text-gray-600">
                  {invite.user.name ? `${invite.user.name} · ` : ""}{invite.user.email_address}
                  <span className="text-gray-400"> · invited {new Date(invite.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Borrowers List */}
      {borrowers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
          <svg className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No borrowers yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">Add your first library member to get started</p>
          <button
            className="px-4 sm:px-6 py-2 bg-amber-800 text-amber-50 rounded-lg hover:bg-amber-900 transition-colors text-sm sm:text-base"
            onClick={() => navigate("/borrowers/new")}
          >
            Add First Borrower
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pageBorrowers.map((borrower) => (
            <div
              key={borrower.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg flex-shrink-0">
                    {borrower.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/borrowers/${borrower.id}`}
                      className="text-lg sm:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors block truncate"
                    >
                      {borrower.name}
                    </Link>
                    {borrower.email && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{borrower.email}</p>
                    )}
                    {borrower.overdue_books_count > 0 && (
                      <p className="text-xs sm:text-sm font-semibold text-red-700 mt-1">
                        ⚠ {borrower.overdue_books_count} {borrower.overdue_books_count === 1 ? "book" : "books"} overdue
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                  <div className="text-left sm:text-right">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Standing</p>
                    {getStandingBadge(borrower.standing)}
                  </div>
                  
                  <Link
                    to={`/borrowers/${borrower.id}`}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">View Details →</span>
                    <span className="sm:hidden">View →</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(borrower)}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <p className="text-center text-sm text-gray-500 mt-6">
          Showing {(currentPage - 1) * BORROWERS_PER_PAGE + 1}–{Math.min(currentPage * BORROWERS_PER_PAGE, borrowers.length)} of {borrowers.length} members
        </p>
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default BorrowersList;
