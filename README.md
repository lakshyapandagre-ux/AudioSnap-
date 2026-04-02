# 🎧 AudioSnap — Video to MP3 Converter

Convert any video into clean MP3 audio instantly ⚡
Fast, simple, and no signup required.

---

## 🚀 Features

* 🎬 Convert videos (YouTube, files) to MP3
* ⚡ Fast audio extraction using optimized backend
* 🎯 Multiple quality options (128kbps, 192kbps, 320kbps)
* 🧊 Clean & modern UI (Glassmorphism design)
* 📦 Supports file upload & link-based conversion
* 🔁 Real-time progress tracking
* ❌ Error handling & retry system

---

## 🛠️ Tech Stack

### Frontend

* React + TypeScript
* Tailwind CSS
* Vite

### Backend

* FastAPI
* yt-dlp (video extraction)
* FFmpeg (audio processing)

### Deployment

* Frontend → Vercel
* Backend → Railway

---

## 📸 Preview

> Add screenshots of your UI here
> (Homepage, Conversion UI, Progress bar)

---

## ⚙️ Installation (Local Setup)

### 1️⃣ Clone the repo

```bash
git clone https://github.com/lakshyapandagre-ux/AudioSnap-.git
cd AudioSnap-
```

---

### 2️⃣ Backend Setup

```bash
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn main:app --reload
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Environment Variables

Create `.env` in frontend:

```env
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Deployment

### Backend (Railway)

* Connect GitHub repo
* Set start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

### Frontend (Vercel)

* Import project
* Add env:

```env
VITE_API_URL=https://your-backend-url
```

---

## ⚠️ Notes

* Instagram Reels may not work due to platform restrictions
* Ensure FFmpeg is installed for audio extraction
* Large videos may take time depending on server performance

---

## 📌 Future Improvements

* 🔐 User authentication
* 📊 Download history
* ☁️ Cloud storage integration
* 🎵 More format support (WAV, AAC)

---

## 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Lakshya Pandagre (Lucky)**
🚀 AIML Enthusiast | Developer

---

⭐ If you like this project, give it a star!
