# 🎨 InShift Frontend – Smart Workforce UI

## 📌 Project Description
The InShift Frontend is a React-based web application that provides an interactive and user-friendly interface for managing attendance, shifts, overtime, and presence intelligence.

It connects with the InShift backend to deliver real-time notifications, analytics dashboards, and secure biometric-based workflows.

---

## 🚀 Features

### 👨‍💼 Employee Interface
- Login with email & password
- Passkey (WebAuthn) biometric verification
- Attendance check-in with location
- View shifts (calendar & list)
- Shift actions:
  - Request reschedule
  - Swap shifts
  - Pick open shifts
- Overtime (OT):
  - Start/stop timer
  - Submit requests
  - Track status
- Receive real-time notifications
- View personal analytics

---

### 🧑‍💻 Admin Interface
- Unified Dashboard (Attendance + Intelligence)
- View daily risk overview
- Suspicious employee detection cards
- AI-generated summaries & insights
- Analytics charts (presence, location, trends)
- Send notifications to employees
- Approve/reject devices and OT

---

## 🔔 Notifications
- Firebase Cloud Messaging (FCM) integration
- Foreground & background notifications
- Service Worker enabled

---

## 📊 Dashboard Highlights
- 📈 Presence analytics charts
- 🧠 AI risk summaries
- 📍 Location behavior tracking
- ⏱️ Lateness pattern visualization

---

## 🛠️ Tech Stack
- React.js
- React Router
- Axios
- Firebase (FCM)
- WebAuthn (Passkeys)
- Chart libraries (for analytics)

---

## 📁 Project Structure
src/
├── components/
├── pages/
├── services/
├── hooks/
├── utils/
├── App.js
└── main.jsx


---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-repo/inshift-frontend.git
cd inshift-frontend

npm install

npm run dev
