# Car Selling Dashboard Website - Frontend

A modern, responsive React-based car selling dashboard website with role-based access control for administrators and customers.

## 🚀 Features

### Admin Features

- **Dashboard**: Yearly/monthly sales reports, total stock, client requests, completed orders
- **Car Management**: Add car brands/categories, manage car inventory with full CRUD operations
- **Order Management**: View all orders, update status, generate PDF invoices
- **Analytics**: Sales charts, top-selling cars and brands, revenue tracking

### User Features

- **Authentication**: Secure login system with role-based access
- **Car Catalog**: Browse, search, filter, and sort cars
- **Shopping Cart**: Add cars, update quantities, checkout
- **Order History**: View past orders and download invoices
- **Responsive Design**: Works on desktop, tablet, and mobile

### Additional Features

- **Dark/Light Mode**: Toggle between themes
- **Real-time Search**: Instant search and filtering
- **Professional UI**: Modern design with Tailwind CSS
- **Mock Data**: Complete demo data for testing

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **React Router DOM** - Client-side routing
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Context API** - State management

## 📦 Installation

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm start
   ```

4. **Open your browser and visit:**
   ```
   http://localhost:3000
   ```

## 🔐 Demo Credentials

### Admin Access

- **Username:** `admin`
- **Password:** `admin123`
- **Features:** Full access to dashboard, car management, order management

### User Access

- **Username:** `user`
- **Password:** `user123`
- **Features:** Browse cars, manage cart, place orders

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with sidebar and header
│   └── ProtectedRoute.tsx  # Route protection component
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── CartContext.tsx # Shopping cart state
│   └── ThemeContext.tsx # Theme management
├── pages/              # Page components
│   ├── Login.tsx       # Authentication page
│   ├── Dashboard.tsx   # Admin dashboard
│   ├── CarCatalog.tsx  # Car browsing page
│   ├── CarDetails.tsx  # Individual car details
│   ├── Cart.tsx        # Shopping cart
│   ├── Orders.tsx      # User order history
│   ├── CarManagement.tsx  # Admin car management
│   └── OrderManagement.tsx # Admin order management
├── services/           # API and data services
│   └── mockData.ts     # Mock data and API simulation
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## 🎨 Key Components

### Authentication System

- Role-based access control (Admin/User)
- Protected routes
- Persistent login state
- Secure logout functionality

### Shopping Cart

- Add/remove cars
- Quantity management
- Price calculations
- Local storage persistence

### Dashboard Analytics

- Monthly sales charts
- Top-selling brands pie chart
- Revenue statistics
- Order status tracking

### Car Management

- Full CRUD operations
- Search and filtering
- Image management
- Inventory tracking

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (320px - 767px)

## �� Features in Detail

### Admin Dashboard

- **Sales Overview**: Total revenue, orders, and growth metrics
- **Charts**: Interactive monthly sales and brand performance
- **Quick Actions**: Access to car and order management
- **Statistics**: Real-time data on inventory and sales

### Car Catalog

- **Advanced Search**: Search by brand, model, or category
- **Smart Filtering**: Filter by price, year, fuel type, transmission
- **Sorting Options**: Sort by price, year, mileage
- **Grid/List View**: Toggle between display modes

### Order Management

- **Status Tracking**: Pending → Approved → Shipped → Delivered
- **Invoice Generation**: Professional PDF invoices
- **Order Details**: Complete order information
- **Bulk Operations**: Update multiple orders

### Shopping Experience

- **Wishlist**: Save favorite cars
- **Cart Management**: Easy quantity updates
- **Checkout Process**: Streamlined ordering
- **Order History**: Track past purchases

## 🚀 Future Enhancements

- Online payment integration (Stripe, PayPal)
- Real-time notifications
- Live chat support
- Advanced analytics
- Email marketing integration
- Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please contact the development team.

---

**Built with ❤️ using React and TypeScript**
