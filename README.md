# 🌆 City Insights Dashboard

A lightweight full-stack web application that provides comprehensive city information by aggregating data from multiple public APIs. The system displays real-time weather, population data, currency details, and keeps a history of searches in a MongoDB database.

---

## 🚀 Features

- 🌍 **City Search** – Search for any city worldwide  
- 🌤️ **Real-time Weather** – Current conditions & temperature  
- 📊 **Population Data** – Latest available population stats  
- 💱 **Currency Details** – Local currency & exchange rates  
- 📈 **Statistics Dashboard** – Search history & analytics  
- 💾 **MongoDB Storage** – Persistent search history  
- 🔒 **Secure Backend** – JWT authentication & API key validation  
- 📱 **Responsive UI** – Works across all devices  

---

## 🛠️ Technology Stack

### **Frontend**
- HTML5, CSS3, JavaScript  
- Font Awesome  
- Google Fonts (Poppins)

### **Backend**
- Node.js + Express  
- MongoDB + Mongoose  
- JWT Authentication  
- Helmet, CORS, Express Validator  

### **External APIs**
- GeoDB Cities API  
- OpenWeather API  
- RestCountries API  
- ExchangeRate API  

---

## ⚙️ Prerequisites

Install the following before running the project:

- **Node.js** (v14+)  
- **Git**  
- **API Keys:**
  - GeoDB Cities API  
  - OpenWeather API  
- **MongoDB Atlas** (or local MongoDB)

---

## 🚀 Getting Started

### **1. Clone the Repository**
```bash
git clone https://github.com/NeeshaDewmini/city-insights-dashboard.git
cd city-insights-dashboard
```

### Backend Setup

### **2. Install dependencies**
```bash
cd backend
npm install
```

### **3. Configure Environment Variables**
cp .env.example .env


### Update .env with your API keys:

PORT=5000
MONGODB_URI=your_mongodb_connection_string  
JWT_SECRET=your_jwt_secret_key  
BACKEND_API_KEY=city_insight_backend_key_2024  
GEO_API_KEY=your_geodb_api_key  
WEATHER_API_KEY=your_openweather_api_key

### **4. Start Backend**
```bash
npm run dev
```

---


## 🌐 Frontend Setup
```bash
cd ../frontend

# Open index.html directly OR run:
npx live-server
```

---

## 🔌 API Endpoints

### Authentication

POST /api/auth/token – Generate JWT

GET /api/auth/profile – Get authenticated user

### City Data

POST /api/saveData – Save search result

GET /api/records – Get search history

GET /api/stats – Get statistics

### Health

GET /health

GET /api/test

---

## 🧪 Testing Backend
```bash
curl http://localhost:5000/health
```


---


## 🐞 Troubleshooting

| Issue                  | Fix                                    |
| ---------------------- | -------------------------------------- |
| Port already in use    | Change `PORT` in `.env`                |
| CORS errors            | Check CORS settings in `server.js`     |
| API key invalid        | Re-check `.env` values                 |
| MongoDB not connecting | Ensure cluster whitelist + correct URI |

---

📧 Contact

Name: Janeesha Dewmini  
GitHub: https://github.com/NeeshaDewmini  
LinkedIn: https://www.linkedin.com/in/janeesha-dewmini-68500b239/

