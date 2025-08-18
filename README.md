

🏡 Real Estate Insights Chatbot


<img width="236" height="238" alt="Screenshot_2025-08-18_215011-removebg-preview" src="https://github.com/user-attachments/assets/2d9ffa3d-57f9-4986-b91a-207d40eae384" />


A **full-stack platform** designed to help **homebuyers, renters, investors, and agents** interact with real estate data in a conversational way.
By integrating **AI-driven chat** with **Snowflake-powered U.S. real estate datasets**, users can easily access **property listings, pricing insights, and neighborhood comparisons** through a simple and intuitive chatbot interface.

---

❓ Problem We’re Trying to Solve

Real estate data is often:

Scattered across multiple listing websites, making it difficult to compare properties.

Complex for regular buyers who don’t understand raw numbers or datasets.

Static – traditional listing sites don’t let you ask questions like a conversation.

Outdated – many datasets are delayed or incomplete, especially in emerging markets.

🏠 Our chatbot bridges the gap by making property insights as easy as chatting with a friend.

---

📊 Industry Stats

The global real estate market is valued at $6.8 trillion in 2025 and projected to keep growing.

AI in real estate is expected to reach $733 billion by 2030, driven by smart property search and predictive analytics.

In the Philippines, property is the second-largest household investment after education, yet:

Only 40% of buyers trust current online listings as accurate.

There’s no centralized AI-powered property insights system for the local market.

<img width="834" height="606" alt="image" src="https://github.com/user-attachments/assets/c06e9ff9-e415-4286-8b19-58952b0eb7cf" />
https://vocal.media/education/will-real-estate-tokenization-revolutionize-the-industry


---

🌏 Opportunities for PH Real Estate Data

Transparency & Trust – AI-driven summaries can help fix distrust in PH property listings.

Market Growth – With rapid urbanization, PH real estate is a ₱6-trillion market by 2030.

Foreign Investors – Demand for clear, data-backed property insights in Metro Manila, Cebu, and Davao.

Future Expansion – Integrating mortgage rates, land use data, and rental yields into a conversational platform.

🚀 Long-term vision: Localized AI real estate chatbot for the Philippine market with BIR, Pag-IBIG, and property tax data integration.

<img width="844" height="611" alt="image" src="https://github.com/user-attachments/assets/178935de-6d0b-46b6-9a49-bc4f3e099bb6" />
https://forbesasiacustom.com/the-philippines-a-roadmap-to-success/#:~:text=The%20Philippines%E2%80%99%20real%20estate%20market,story%20architectural

---

🌟 Core Philosophy

* **Accessible** – Everyone can query real estate data without technical barriers.
* **Smart** – AI-powered queries return meaningful insights instantly.
* **Reliable** – Backed by Snowflake’s secure data warehouse.
* **Scalable** – Modular design for future expansion (e.g., rentals, investments, mortgage insights).

---

🎯 Key Features

1. **Conversational Querying**

   * Ask natural language questions like *“Show me 3-bedroom houses*.
   * Get **instant responses** powered by Snowflake datasets.

2. **Dynamic Property Search**

   * Filter by **city, state, property type**.

3. **Responsive Chat UI**

   * Built with **React + TailwindCSS**.
   * Desktop optimized.

4. **Secure & Scalable Backend**

   * **Express.js** server handles API requests.
   * **Snowflake SDK** powers real-time queries.
   * Environment variables protect sensitive credentials.

---

👥 User Roles & Capabilities

**End Users**

* Ask chatbot about listings
* Explore neighborhoods with insights.

---

🏗️ Technical Architecture

Frontend Stack

* React 18 (UI)
* TypeScript (strong typing)
* Vite (fast bundler)
* Tailwind CSS (styling)
* React Router DOM (navigation)

Backend Stack

* Node.js + Express (REST API)
* Snowflake SDK (database queries)
* Dotenv (environment variables)
* CORS (cross-origin requests)

Data Source

`US_REAL_ESTATE` dataset (property listings, pricing, demographics).

---

📊 Database Schema (Simplified)

Listings Table

| Field          | Type    | Description        |
| -------------- | ------- | ------------------ |
| id             | uuid    | Primary key        |
| city           | text    | City name          |
| state          | text    | State code         |
| property\_type | text    | House, Condo, etc. |
| neighborhood   | text    | Neighborhood name  |
| listed\_at     | date    | Listing date       |

---

🔐 Security & Privacy

* **Environment Variables**: Protect Snowflake credentials.
* **Role-Based Queries**: Different data access levels possible.
* **Data Encryption**: Snowflake ensures secure storage.

---

🚀 Getting Started

Prerequisites

* Node.js 18+
* Snowflake account (with real estate dataset access)

Installation

```bash
# Clone repository
git clone https://github.com/your-username/real-estate-chatbot.git
cd real-estate-chatbot

# Install dependencies
npm install
```

### Run Development Mode

```bash
# Backend (Express server)
cd server
npm start

# Frontend (Vite)
cd client
npm run dev
```

---

📱 Example User Journeys

Buyer Journey

1. Open chatbot → Ask *“Show me apartments in New York”*
2. View property details.
3. Save or refine search by adding filters.

Investor Journey

1. Query *“Top 5 cities with highest rental yield.”*
2. Get summarized Snowflake insights.
3. Compare neighborhoods with growth predictions.

---

🔮 Future Roadmap

* Phase 1 (MVP)** ✅

  * Chatbot querying with Snowflake dataset.
  * Dynamic property filtering.

* Phase 2 (Enhancements)** 🚧

  * Save user searches & preferences.
  * More neighborhood analytics (schools, transport).
  * Interactive property maps.

* Phase 3 (Expansion)** 📈

  * Agent onboarding for listings.
  * Mortgage calculator integration.
  * Mobile app support.

---

📈 Success Metrics

* **User Growth**: Active chatbot queries per month.
* **Accuracy**: % of correct property matches returned.
* **Engagement**: Avg. queries per session.
* **Expansion**: Dataset coverage across U.S. states.

---

🤝 Contributing

1. Fork repo.
2. Create feature branch: `git checkout -b feature/new-feature`.
3. Commit changes: `git commit -m "Added feature"`.
4. Push branch: `git push origin feature/new-feature`.
5. Open pull request.

---

📄 License

This project is licensed under the **MIT License**.
