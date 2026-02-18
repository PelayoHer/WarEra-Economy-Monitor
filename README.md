# 🛡️ WarEra Economy Monitor

> **Advanced Market Analytics & Profitability Calculator for WarEra Strategy Game**


## 📋 Overview

**WarEra Economy Monitor** is a high-performance web application designed to give players a competitive edge in the WarEra economy. It automatically tracks market prices, calculates complex production chains, and identifies the most profitable manufacturing opportunities in real-time.

Built with a futuristic "Command Center" aesthetic, it features live data visualization, dynamic market mood indicators, and a robust calculation engine that accounts for labor costs, raw material fluctuations, and production efficiency.

---

## ✨ Key Features

### 🧠 **Intelligent Analytics**
- **Real-Time Profitability Ranking**: Instantly see which products yield the highest Net Profit per hour.
- **Dynamic "Make vs Buy" Logic**: automatically recommends whether to craft an item or buy it from the market based on current component prices.
- **Market Mood Indicator**: The background ambience shifts color (Green/Red) based on overall market profitability trends (Bullish/Bearish).

### 🖥️ **Tactical Dashboard**
- **Glassmorphism UI**: Modern, translucent interface design with blurred backdrops.
- **"Zen Mode"**: Toggleable distraction-free view for focused analysis.
- **Visual Data**: 
  - **Profit Bars**: Visual indicators of profit margins in the table.
  - **Particle Effects**: subtle background animations.
  - **Tactical Grid**: overlays for a military-grade aesthetic.

### ⚙️ **Advanced Tools**
- **Salary Calculator**: Adjustable "Salary per Work Point" slider to simulate different labor cost scenarios.
- **Manual Price Overrides**: Override specific market prices manually if the API data is stale or if you want to simulate future market shifts.
- **Multi-Server Support**: Easy toggle between languages (ES/EN) and distinct date formatting.
- **Data Export**: Download your analysis as **CSV** or **JSON** for offline use in Excel.

### 🚀 **Performance**
- **Smart Caching**: Request-based caching (60s) to prevent API bans while ensuring fresh data.
- **Auto-Refresh**: Intelligent polling system that retries automatically if data is stale.
- **Server-Side Scraping**: Powered by Next.js API Routes and Cheerio for robust data fetching.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Animations
- **Icons**: [Lucide React](https://lucide.dev/)
- **Scraping**: [Cheerio](https://cheerio.js.org/) + [Axios](https://axios-http.com/)
- **State Management**: React Hooks + LocalStorage Persistence
- **Internationalization**: Custom lightweight i18n solution

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.17.0 or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/warera-economy-monitor.git
   cd warera-economy-monitor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory. You need to provide your WarEra session cookies/token to access market data.

   ```env
   # .env.local
   # OPTION A: Full Cookie String (Recommended)
   WARERA_COOKIE="PHPSESSID=your_session_id_here; other_cookies=..."

   # OPTION B: Just the Session Token (Legacy)
   WARERA_TOKEN="your_phpsessid_here"
   ```

   > **How to get your Token:**
   > 1. Log in to WarEra in your browser.
   > 2. Open Developer Tools (F12) -> Network Tab.
   > 3. Refresh the page.
   > 4. Click on the main request (`game.php`).
   > 5. Look for `Cookie` in "Request Headers". Copy the value.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌍 Deployment

### Deploy on Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com/):

1. **Push your code to GitHub.**
2. **Import the project** in Vercel Dashboard.
3. **Add Environment Variables**:
   - Key: `WARERA_COOKIE` (or `WARERA_TOKEN`)
   - Value: Your session cookie string.
4. **Deploy!** Vercel will automatically detect Next.js configuration.

> **Note on Static Files:** The project uses `data/recipes.json` for crafting logic. Ensure this folder is included in your git repository (checked in `.gitignore`).

---

## 📖 Usage Guide

1. **The Table**: The main view shows all craftable items ranked by Profit.
   - **Green Row**: Profitable to craft.
   - **Red Badge**: Producing this items costs more than selling it.
   - **Recommendation**: "Produce" means it's cheaper to make it than buy it. "Buy" means the opposite.

2. **Input Costs**:
   - Use the **Manual Prices** section at the bottom to override the cost of raw materials (e.g., if you farm your own Grain, set Grain price to 0).
   - Adjust **Salary/PT** slider to match current worker wages.

3. **Exporting**:
   - Click "Export CSV" to get a snapshot of the current market state for analysis in Excel/Google Sheets.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


## ❤️ Credits

Developed for the **WarEra Community**.
*Visual Design & Architecture by PelayoHer*

---

*Disclaimer: This tool is not affiliated with, endorsed, or sponsored by WarEra. Use at your own risk.*
