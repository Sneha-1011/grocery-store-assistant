# 🛒 Grocery-Store-Assistant

An interactive web application that helps users optimize grocery selections within a specified budget and price range using a multi-stage graph approach.

---

## 🚀 Features

- 💰 Input **total budget** and **price range per item**
- 📦 Add grocery items dynamically with **backend validation**
- 🔍 Real-time **product search** to verify item availability
- 💡 Supports future **multi-stage graph optimization**
- 💾 Persists user data with **sessionStorage**
- 🎨 Clean and responsive UI with **Tailwind CSS**
- 🎬 Smooth animations using **Framer Motion**

---

## 🧑‍💻 Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js + API Routes (Next.js)
- **Icons:** Lucide-react
- **Storage:** sessionStorage for temporary state

---

## 📂 Project Structure

/app
/actions → API logic for product search
/budget → Page to input budget and item list
/alternatives → Optimized product selection
/components → UI components (InputCard, Button, ListItems)

## 🧪 How It Works

1. **Enter your total budget**.
2. **Define a cost range (min & max)** for items.
3. **Add grocery items** dynamically to your list.
4. Backend **validates the item** via a search endpoint.
5. Choose the **best combination of grocery** from the given suggestions based on **design algorithms**.
6. Proceed to the **checkout page** and finalize.

## 📬 Feedback

Have suggestions? Open an issue or submit a pull request.  
Let’s make smart grocery shopping simple and optimized!
