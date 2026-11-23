import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://eqojwsrkktcedxwhphqy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxb2p3c3Jra3RjZWR4d2hwaHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjEzNzAsImV4cCI6MjA5NjY5NzM3MH0.89tx_HOtBDcFHuAhGAlCJYq4cjByIcsygKS10lShPEw";

const db = {
  async getBookings() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return res.json();
  },
  async addBooking(booking) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(booking)
    });
    return res.json();
  },
  async updateBooking(id, updates) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  async deleteBooking(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  }
};

const ROOMS = [
  { id: "sunflower", name: "Sunflower", emoji: "🌻", color: "#F6C90E", bg: "#FFFBEA", accent: "#B8940A" },
  { id: "pinkblossom", name: "Pink Blossom", emoji: "🌸", color: "#F4A7B9", bg: "#FFF0F4", accent: "#C06080" },
  { id: "ocean", name: "Ocean", emoji: "🌊", color: "#4EAAD4", bg: "#EFF9FF", accent: "#1A6E96" },
  { id: "forest", name: "Forest", emoji: "🌿", color: "#5CA96B", bg: "#F0FAF2", accent: "#2F7040" },
];

const HOURS = Array.from({ length: 13 }, (_, i) => {
  const h = i + 9;
  return { value: h, label: `${h === 12 ? 12 : h > 12 ? h - 12 : h}:00 ${h < 12 ? "AM" : "PM"}` };
});

const USERS = [
  { username: "supervisor", password: "Sunflower@1", role: "supervisor", name: "Beverley" },
  { username: "emma", password: "Blossom@2", role: "staff", name: "Emma" },
  { username: "lavinia", password: "Forest@4", role: "staff", name: "Lavinia" },
  { username: "leonie", password: "Ocean@3", role: "staff", name: "Leonie" },
  { username: "andy", password: "Amber@6", role: "staff", name: "Andy" },
  { username: "helen.watts", password: "Circle@5", role: "staff", name: "Helen Watts" },
  { username: "lisa.osei", password: "Willow@7", role: "staff", name: "Lisa Osei" },
  { username: "mark.davies", password: "Petal@8", role: "staff", name: "Mark Davies" },
  { username: "sian.hughes", password: "Meadow@9", role: "staff", name: "Sian Hughes" },
  { username: "anna.reed", password: "Lotus@10", role: "staff", name: "Anna Reed" },
];

const todayStr = () => new Date().toISOString().split("T")[0];

function formatDate(str) {
  return new Date(str + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("calendar");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [modal, setModal] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "", error: "" });
  const [bookingForm, setBookingForm] = useState({ name: "", purpose: "", confirmed: false });
  const [editForm, setEditForm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getBookings();
      if (Array.isArray(data)) setBookings(data);
    } catch (e) {
      showToast("Could not load bookings", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user, fetchBookings]);

  const handleLogin = () => {
    const found = USERS.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (found) { setUser(found); setLoginForm({ username: "", password: "", error: "" }); }
    else setLoginForm(f => ({ ...f, error: "Invalid username or password" }));
  };

  const getBooking = (roomId, date, hour) =>
    bookings.find(b => b.room_id === roomId && b.date === date && b.hour === hour);

  const makeBooking = async () => {
    const payload = {
      room_id: modal.roomId,
      date: selectedDate,
      hour: modal.hour,
      name: bookingForm.name,
      purpose: bookingForm.purpose,
      booked_by: user.name,
      booked_by_username: user.username,
    };
    setModal(null);
    setBookingForm({ name: "", purpose: "", confirmed: false });
    try {
      await db.addBooking(payload);
      await fetchBookings();
      showToast("Room booked successfully!");
    } catch (e) {
      showToast("Failed to save booking", "error");
    }
  };

  const deleteBooking = async (id) => {
    setModal(null);
    setEditForm(null);
    try {
      await db.deleteBooking(id);
      await fetchBookings();
      showToast("Booking removed.", "info");
    } catch (e) {
      showToast("Failed to remove booking", "error");
    }
  };

  const saveEdit = async (id) => {
    setModal(null);
    setEditForm(null);
    try {
      await db.updateBooking(id, { name: editForm.name, purpose: editForm.purpose });
      await fetchBookings();
      showToast("Booking updated.");
    } catch (e) {
      showToast("Failed to update booking", "error");
    }
  };

  const openSlot = (roomId, hour) => {
    const existing = getBooking(roomId, selectedDate, hour);
    if (existing) {
      setModal({ type: "view", roomId, hour, booking: existing });
      setEditForm({ name: existing.name, purpose: existing.purpose });
    } else {
      setModal({ type: "book", roomId, hour });
      setBookingForm({ name: user.name, purpose: "", confirmed: false });
    }
  };

  const allBookingsList = [...bookings].sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

  if (!user) return <LoginScreen form={loginForm} setForm={setLoginForm} onLogin={handleLogin} />;

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: "100vh", background: "#F9F6F0", color: "#2C2418" }}>
      <header style={{ background: "linear-gradient(135deg, #3D5A3E 0%, #2C4230 100%)", color: "white", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0" }}>
          <span style={{ fontSize: "2rem" }}>🌿</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "bold", letterSpacing: "0.04em" }}>The Sunflower Circle</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.75, letterSpacing: "0.08em", textTransform: "uppercase" }}>Room Booking System</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {user.role === "supervisor" && (
            <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "4px" }}>
              <button onClick={() => setView("calendar")} style={{ padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", background: view === "calendar" ? "white" : "transparent", color: view === "calendar" ? "#2C4230" : "white", transition: "all 0.2s" }}>Calendar</button>
              <button onClick={() => setView("overview")} style={{ padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", background: view === "overview" ? "white" : "transparent", color: view === "overview" ? "#2C4230" : "white", transition: "all 0.2s" }}>Overview</button>
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{user.name}</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.7, textTransform: "capitalize" }}>{user.role}</div>
          </div>
          <button onClick={() => fetchBookings()} title="Refresh" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem" }}>↻</button>
          <button onClick={() => { setUser(null); setBookings([]); }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem" }}>Sign Out</button>
        </div>
      </header>

      {loading && (
        <div style={{ textAlign: "center", padding: "1rem", background: "#FFF8E7", borderBottom: "1px solid #F6C90E", fontSize: "0.85rem", color: "#8B6914" }}>
          Loading bookings…
        </div>
      )}

      {view === "overview" && user.role === "supervisor" ? (
        <OverviewPanel bookings={allBookingsList} currentUser={user}
          onDelete={(id) => deleteBooking(id)}
          onEdit={(booking) => { setModal({ type: "view", roomId: booking.room_id, hour: booking.hour, booking }); setEditForm({ name: booking.name, purpose: booking.purpose }); }}
        />
      ) : (
        <CalendarView selectedDate={selectedDate} setSelectedDate={setSelectedDate} getBooking={getBooking} openSlot={openSlot} user={user} />
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={() => setModal(null)}>
          <div style={{ background: "white", borderRadius: "16px", padding: "2rem", width: "100%", maxWidth: "440px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", margin: "1rem" }} onClick={e => e.stopPropagation()}>
            {modal.type === "book" && <BookModal modal={modal} form={bookingForm} setForm={setBookingForm} onBook={makeBooking} onClose={() => setModal(null)} selectedDate={selectedDate} />}
            {modal.type === "view" && <ViewModal modal={modal} editForm={editForm} setEditForm={setEditForm} onDelete={() => deleteBooking(modal.booking.id)} onSave={() => saveEdit(modal.booking.id)} onClose={() => setModal(null)} isSupervisor={user.role === "supervisor"} currentUser={user} selectedDate={selectedDate} />}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: toast.type === "success" ? "#2F7040" : toast.type === "info" ? "#555" : "#C0392B", color: "white", padding: "0.75rem 1.5rem", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 2000, animation: "fadeIn 0.3s ease", fontSize: "0.9rem" }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}

function LoginScreen({ form, setForm, onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #3D5A3E 0%, #2C4230 40%, #1A2E1C 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ background: "white", borderRadius: "20px", padding: "3rem 2.5rem", width: "100%", maxWidth: "400px", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", margin: "1rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🌻</div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#2C2418", fontWeight: "normal" }}>The Sunflower Circle</h1>
          <p style={{ margin: "0.25rem 0 0", color: "#888", fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Room Booking</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input placeholder="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} onKeyDown={e => e.key === "Enter" && onLogin()} style={inputStyle} />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && onLogin()} style={inputStyle} />
          {form.error && <div style={{ color: "#C0392B", fontSize: "0.85rem", textAlign: "center" }}>{form.error}</div>}
          <button onClick={onLogin} style={{ background: "linear-gradient(135deg, #3D5A3E, #2C4230)", color: "white", border: "none", padding: "0.9rem", borderRadius: "10px", fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", marginTop: "0.5rem" }}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ selectedDate, setSelectedDate, getBooking, openSlot, user }) {
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return (
    <main style={{ padding: "1.5rem 2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", marginBottom: "0.75rem" }}>Select Date</div>
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {dateOptions.map(d => {
            const date = new Date(d + "T12:00:00");
            const isToday = d === todayStr();
            const isSelected = d === selectedDate;
            return (
              <button key={d} onClick={() => setSelectedDate(d)} style={{ minWidth: "64px", padding: "0.6rem 0.5rem", borderRadius: "12px", border: isSelected ? "2px solid #3D5A3E" : "2px solid transparent", background: isSelected ? "#3D5A3E" : "white", color: isSelected ? "white" : "#444", cursor: "pointer", fontFamily: "inherit", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.15s" }}>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>{date.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "2px 0" }}>{date.getDate()}</div>
                <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>{date.toLocaleDateString("en-GB", { month: "short" })}</div>
                {isToday && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSelected ? "white" : "#3D5A3E", margin: "2px auto 0" }} />}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginBottom: "1rem", fontSize: "1.1rem", color: "#555", fontStyle: "italic" }}>{formatDate(selectedDate)}</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "700px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px repeat(4, 1fr)", gap: "6px", marginBottom: "6px" }}>
            <div />
            {ROOMS.map(room => (
              <div key={room.id} style={{ background: room.color, borderRadius: "10px", padding: "0.75rem 0.5rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "1.4rem" }}>{room.emoji}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: room.accent, marginTop: "2px" }}>{room.name}</div>
              </div>
            ))}
          </div>
          {HOURS.map(({ value, label }) => (
            <div key={value} style={{ display: "grid", gridTemplateColumns: "80px repeat(4, 1fr)", gap: "6px", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "12px", fontSize: "0.78rem", color: "#999", fontWeight: "bold" }}>{label}</div>
              {ROOMS.map(room => {
                const booking = getBooking(room.id, selectedDate, value);
                return <SlotCell key={room.id} room={room} booking={booking} onClick={() => openSlot(room.id, value)} currentUser={user} />;
              })}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function SlotCell({ room, booking, onClick, currentUser }) {
  const isBooked = !!booking;
  const isOwner = isBooked && booking.booked_by_username === currentUser.username;
  const isSupervisor = currentUser.role === "supervisor";
  const canInteract = !isBooked || isOwner || isSupervisor;

  return (
    <div
      onClick={canInteract ? onClick : undefined}
      style={{ borderRadius: "8px", padding: "0.4rem 0.6rem", minHeight: "44px", background: isBooked ? (isOwner ? room.color : "#F0F0EC") : "white", border: isBooked ? (isOwner ? `2px solid ${room.accent}` : "2px solid #CCC") : "2px solid #E8E4DC", cursor: canInteract ? "pointer" : "default", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s", boxShadow: isBooked && isOwner ? `0 2px 8px ${room.color}88` : "0 1px 4px rgba(0,0,0,0.04)", opacity: isBooked && !isOwner && !isSupervisor ? 0.7 : 1 }}
      onMouseEnter={e => { if (canInteract) { e.currentTarget.style.transform = "scale(1.01)"; if (!isBooked) e.currentTarget.style.borderColor = room.color; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = isBooked ? (isOwner ? room.accent : "#CCC") : "#E8E4DC"; }}
    >
      {isBooked ? (
        <>
          <span style={{ fontSize: "0.85rem" }}>{isOwner ? "✏️" : "🔒"}</span>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "bold", color: isOwner ? room.accent : "#999", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{booking.name}</div>
            {booking.purpose && <div style={{ fontSize: "0.65rem", color: isOwner ? room.accent : "#AAA", opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{booking.purpose}</div>}
            {isOwner && <div style={{ fontSize: "0.6rem", color: room.accent, opacity: 0.7, marginTop: "1px" }}>Your booking</div>}
          </div>
        </>
      ) : (
        <div style={{ fontSize: "0.72rem", color: "#CCC", width: "100%", textAlign: "center" }}>Available</div>
      )}
    </div>
  );
}

function BookModal({ modal, form, setForm, onBook, onClose, selectedDate }) {
  const room = ROOMS.find(r => r.id === modal.roomId);
  const hour = HOURS.find(h => h.value === modal.hour);
  const canBook = form.name.trim() && form.purpose.trim() && form.confirmed;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: room.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{room.emoji}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#2C2418" }}>Book {room.name}</h2>
          <div style={{ fontSize: "0.85rem", color: "#888" }}>{formatDate(selectedDate)} · {hour.label}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label style={labelStyle}>Your Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Full name" />
        </div>
        <div>
          <label style={labelStyle}>Purpose / Session Type</label>
          <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} style={inputStyle} placeholder="e.g. Counselling session, team meeting..." />
        </div>
        <div style={{ background: "#FFF8E7", border: "1px solid #F6C90E", borderRadius: "8px", padding: "0.75rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <input type="checkbox" id="confirm" checked={form.confirmed} onChange={e => setForm(f => ({ ...f, confirmed: e.target.checked }))} style={{ marginTop: "2px", accentColor: "#3D5A3E", width: "16px", height: "16px", flexShrink: 0 }} />
          <label htmlFor="confirm" style={{ fontSize: "0.82rem", color: "#8B6914", cursor: "pointer", lineHeight: 1.4 }}>
            I confirm this booking. You can edit or cancel your own bookings. Only a supervisor can amend bookings made by others.
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
        <button onClick={canBook ? onBook : undefined} style={{ ...primaryBtnStyle, opacity: canBook ? 1 : 0.4, cursor: canBook ? "pointer" : "not-allowed", flex: 2 }}>
          🔒 Confirm Booking
        </button>
      </div>
    </>
  );
}

function ViewModal({ modal, editForm, setEditForm, onDelete, onSave, onClose, isSupervisor, currentUser, selectedDate }) {
  const room = ROOMS.find(r => r.id === modal.roomId);
  const hour = HOURS.find(h => h.value === modal.hour);
  const [editing, setEditing] = useState(false);
  const isOwner = modal.booking.booked_by_username === currentUser.username;
  const canEdit = isSupervisor || isOwner;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: room.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{room.emoji}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#2C2418" }}>{room.name} — Booked</h2>
          <div style={{ fontSize: "0.85rem", color: "#888" }}>{selectedDate ? formatDate(selectedDate) : ""} · {hour?.label}</div>
        </div>
      </div>
      {editing && canEdit ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Purpose</label>
            <input value={editForm.purpose} onChange={e => setEditForm(f => ({ ...f, purpose: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button onClick={() => setEditing(false)} style={secondaryBtnStyle}>Cancel</button>
            <button onClick={onSave} style={{ ...primaryBtnStyle, flex: 2 }}>Save Changes</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ background: "#F9F6F0", borderRadius: "10px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <InfoRow label="Booked for" value={modal.booking.name} />
            <InfoRow label="Purpose" value={modal.booking.purpose || "—"} />
            <InfoRow label="Created by" value={modal.booking.booked_by} />
            <InfoRow label="Booked at" value={new Date(modal.booking.booked_at).toLocaleString("en-GB")} />
          </div>
          {canEdit ? (
            <>
              {isOwner && !isSupervisor && (
                <div style={{ padding: "0.6rem 0.75rem", background: "#F0F9FF", border: "1px solid #4EAAD4", borderRadius: "8px", fontSize: "0.8rem", color: "#1A6E96", marginBottom: "0.75rem" }}>
                  ✏️ This is your booking — you can edit or cancel it.
                </div>
              )}
              {isSupervisor && !isOwner && (
                <div style={{ padding: "0.6rem 0.75rem", background: "#F5F0FF", border: "1px solid #9B7FD4", borderRadius: "8px", fontSize: "0.8rem", color: "#5B3FA6", marginBottom: "0.75rem" }}>
                  🛡 Supervisor access — editing another user's booking.
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={onClose} style={secondaryBtnStyle}>Close</button>
                <button onClick={() => setEditing(true)} style={{ ...primaryBtnStyle, flex: 1, background: "#4EAAD4" }}>✏️ Edit</button>
                <button onClick={onDelete} style={{ ...primaryBtnStyle, flex: 1, background: "#C0392B" }}>🗑 Remove</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: "0.75rem", background: "#F0F9F2", border: "1px solid #5CA96B", borderRadius: "8px", fontSize: "0.82rem", color: "#2F7040", textAlign: "center", marginBottom: "0.75rem" }}>
                🔒 This booking belongs to another user. Only they or a supervisor can make changes.
              </div>
              <button onClick={onClose} style={{ ...secondaryBtnStyle, width: "100%" }}>Close</button>
            </>
          )}
        </>
      )}
    </>
  );
}

function OverviewPanel({ bookings, currentUser, onDelete, onEdit }) {
  const grouped = {};
  bookings.forEach(b => { if (!grouped[b.date]) grouped[b.date] = []; grouped[b.date].push(b); });

  return (
    <main style={{ padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#2C2418" }}>📋 Supervisor Overview</h2>
        <div style={{ fontSize: "0.8rem", color: "#888", background: "#F0FAF2", border: "1px solid #5CA96B", padding: "4px 12px", borderRadius: "20px" }}>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
        </div>
      </div>
      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", color: "#BBB", padding: "4rem", fontSize: "1.1rem" }}>No bookings yet</div>
      ) : (
        Object.entries(grouped).sort().map(([date, dayBookings]) => (
          <div key={date} style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem", borderBottom: "1px solid #E8E4DC", paddingBottom: "0.4rem" }}>{formatDate(date)}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {dayBookings.map(b => {
                const room = ROOMS.find(r => r.id === b.room_id);
                const hour = HOURS.find(h => h.value === b.hour);
                const isOwner = b.booked_by_username === currentUser.username;
                return (
                  <div key={b.id} style={{ background: "white", borderRadius: "10px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderLeft: `4px solid ${room.color}` }}>
                    <span style={{ fontSize: "1.3rem" }}>{room.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: room.accent }}>{room.name} · {hour.label}</div>
                      <div style={{ fontSize: "0.82rem", color: "#666" }}>{b.name} {b.purpose ? `— ${b.purpose}` : ""}</div>
                      <div style={{ fontSize: "0.72rem", color: "#AAA", marginTop: "1px" }}>Booked by {b.booked_by}{isOwner ? " (you)" : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => onEdit(b)} style={{ background: "#4EAAD4", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem" }}>Edit</button>
                      <button onClick={() => onDelete(b.id)} style={{ background: "#C0392B", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem" }}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </main>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem" }}>
      <span style={{ fontSize: "0.78rem", color: "#999", minWidth: "80px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "0.85rem", color: "#333", fontWeight: "500" }}>{value}</span>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "0.65rem 0.9rem", border: "2px solid #E8E4DC", borderRadius: "8px", fontFamily: "inherit", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", background: "#FAFAFA", color: "#2C2418" };
const labelStyle = { display: "block", fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#888", marginBottom: "0.4rem" };
const primaryBtnStyle = { background: "linear-gradient(135deg, #3D5A3E, #2C4230)", color: "white", border: "none", padding: "0.75rem 1.25rem", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem", letterSpacing: "0.02em" };
const secondaryBtnStyle = { background: "white", color: "#666", border: "2px solid #E8E4DC", padding: "0.75rem 1.25rem", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem", flex: 1 };
