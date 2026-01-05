# SariApp 🛒

**SariApp** is a mobile inventory and sales management system specifically designed for small-scale retail businesses (Sari-Sari stores). Built with **React Native** and **Expo**, it provides a streamlined way to track business performance on the go.

## ✨ Key Features

* **Smart Dashboard:** Real-time tracking of Today's Revenue, Gross Profit, and Expenses.
* **POS System:** Quick transaction recording and automated total calculation.
* **Inventory Management:** Monitor stock levels with built-in "Low Stock" alerts and search functionality.
* **Expense Tracker:** Log business costs such as utilities, rent, or restocking fees.
* **Secure Admin Tools:** Protected database reset feature (Default PIN: 1972) to prevent accidental data loss.
* **Premium UI:** Clean, modern interface designed for high scannability and ease of use.

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (LTS version)
* **Expo CLI** (`npx expo`)
* **EAS CLI** (for generating Android/iOS binaries)

### 2. Installation
Clone the repository and install the necessary dependencies:
npm install
3. Running Locally
Start the development server:

npx expo start
Scan the QR code using the Expo Go app on your Android or iOS device to preview the app.
4. Building the APK (Android)
To generate a standalone installer:
eas build -p android --profile preview

🛠️ Tech Stack
Framework: React Native (Expo SDK 54)
Icons: MaterialCommunityIcons (@expo/vector-icons)
Storage: AsyncStorage (Persistent Local Data)
Styling: StyleSheet (Native Flexbox)

👤 Developer
Name: Richelle Mae Arat

Version: 1.0.1 (Premium)

© 2026 SariApp - Developed by Richelle Mae Arat