# Real Estate Insights Chatbot

A **full-stack web application** that allows users to query U.S. real estate data directly through a chatbot interface.
Built with **React + TypeScript + Vite** for the frontend and **Node.js + Express + Snowflake SDK** for the backend.

The chatbot helps **homebuyers, renters, investors, and agents** get **property listings, price comparisons, and neighborhood insights** in a conversational way.

---

## Table of Contents

* [Features](#-features)
* [Tech Stack](#-tech-stack)
* [Architecture](#-architecture)
* [Installation](#-installation)
* [Environment Variables](#-environment-variables)
* [Running the Project](#-running-the-project)
* [API Endpoints](#-api-endpoints)
* [Frontend Usage](#-frontend-usage)
* [Project Structure](#-project-structure)
* [Development Notes](#-development-notes)
* [Contributing](#-contributing)
* [License](#-license)

---

## Features

* **Conversational Querying** – Ask the chatbot about listings, prices, or neighborhood details.
* **Snowflake-Powered Data** – Uses the `US_REAL_ESTATE` dataset for accurate property insights.
* **Dynamic Filtering** – Search by city, state, price range, or property type.
* **Responsive Design** – Built with Tailwind CSS for seamless desktop and mobile use.
* **Real-Time Results** – Get instant responses from the Snowflake backend.
* **Secure Backend** – Environment variables hide database credentials.
* **Scalable Architecture** – Separate frontend and backend for modular development.

---

## Tech Stack

### **Frontend**

* **React 18** – UI framework
* **TypeScript** – Strong typing
* **Vite** – Fast development bundler
* **Tailwind CSS** – Styling
* **Lucide React** – Icons
* **React Router DOM** – Navigation

### **Backend**

* **Node.js + Express** – REST API
* **Snowflake SDK** – Database connection
* **CORS** – Cross-origin requests
* **Dotenv** – Environment variables

---

## Architecture

```
[Frontend - React + Vite]
   |
   |--> API Requests (fetch)
   |
[Backend - Express]
   |
   |--> Snowflake SDK Queries
   |
[Snowflake Data Cloud]
```

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/real-estate-chatbot.git
cd real-estate-chatbot

# 2. Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory with:

```env
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema
SNOWFLAKE_WAREHOUSE=your_warehouse
PORT=5000
```

---

## Running the Project

### Development (Frontend + Backend concurrently)

```bash
# Run backend (Express API)
cd server
npm install
npm start

# Run frontend (Vite)
cd client
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Frontend Usage

1. Open the app in your browser.
2. Type your query in the chatbot input.
3. Get instant responses with real estate data.
4. Click on results for detailed property views.

---

## Project Structure

```
Real_Estate_Chatbot/
├── index.html
├── package.json
├── src/
│   ├── components/       # UI components
│   ├── pages/            # Page views
│   ├── services/         # API calls
│   └── App.tsx           # Main app entry
├── tailwind.config.js
├── vite.config.ts
└── server/               # Backend API
```

---

## Development Notes

* Uses **Snowflake Cortex** for data queries.
* Frontend is **SPA** with **React Router**.
* Backend follows **REST API** structure.
* `.env` file must be configured before running.
* Ensure Snowflake credentials have **read access** to the dataset.

---

## Contributing

1. Fork this repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Submit a pull request.

---

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file.

Got it — I’ve reviewed your backend code, so I can now make a **fully detailed GitHub README** with **real API documentation** from your actual implementation (no placeholders).

Here’s the complete version:

---

# Real Estate Server

A Node.js and Express backend server that integrates with the **Snowflake Data Cloud** to provide real-time U.S. real estate insights.
It allows users to query listings, compare prices, retrieve neighborhood summaries, and get buying/renting guidance from the `US_REAL_ESTATE` dataset.

---

## Project Structure

```
real-estate-server/
│
├── server.js          # Main backend entry point
├── .env               # Environment variables (Snowflake credentials)
├── package.json       # Dependencies and scripts
└── node_modules/      # Installed dependencies
```

---

## Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/real-estate-server.git
cd real-estate-server
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file in the root directory:

```env
SNOWFLAKE_ACCOUNT=your_snowflake_account
SNOWFLAKE_USERNAME=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema
```

> ⚠ Keep your `.env` private and never commit it to Git.

### 4️⃣ Start the server

```bash
npm start
```

Server will run at:

```
http://localhost:3000
```

---

## API Documentation

All endpoints are prefixed with `/api`.

---

### **1. Test Connection**

**Endpoint:**

```
GET /api/test
```

**Description:**
Checks if the server is running.

**Response:**

```json
{ "message": "Server is running" }
```
]


### **2. Get Buying or Renting Guidance**

**Endpoint:**

```
GET /api/guidance
```

**Query Parameters:**

| Name   | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| budget | int    | Yes      | User budget |
| city   | string | Yes      | City name   |

**Example Request:**

```
GET /api/guidance?budget=900000&city=Portland
```

**Example Response:**

```json
{
  "recommendation": "Buying is more cost-effective in Portland for your budget."
}
```

## License

MIT License – Free to use and modify.

