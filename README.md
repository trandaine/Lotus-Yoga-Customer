# Yoga Customer App

A React Native mobile application for yoga course management and user authentication.

## Abstract

This project implements a comprehensive yoga course marketplace using React Native and Firebase. The application provides user authentication, course browsing, payment processing, and transaction management capabilities.

## Author

**Trần Quang Đại**

## Technologies

- **Frontend**: React Native, TypeScript, Expo
- **Backend**: Firebase Firestore
- **Navigation**: React Navigation
- **State Management**: React Context API

## Architecture

### Authentication Module
```
LoginScreen → AuthContext → Firestore
CreateAccountScreen → User Registration → Database
```

### Main Application Flow
```
Dashboard → Course Discovery → Payment → Transaction
User Profile → Account Management → Settings
```

## Database Schema

### Customers Collection
```typescript
interface Customer {
  balance: number;
  customerId: number;
  dateCreated: string;
  dateOfBirth: string;
  email: string;
  id: number;
  imageUrl: string;
  name: string;
  password: string;
  phoneNumber: string;
}
```

### Courses Collection
```typescript
interface Course {
  id: number;
  name: string;
  description: string;
  duration: number;
  level: string;
  price: number;
  imageUrl: string;
  categoryId: number;
  teacherId: number;
  room: string;
}
```

## Installation

1. Clone repository
```bash
git clone <repository-url>
cd YogaCustomerApp
```

2. Install dependencies
```bash
npm install
```

3. Configure Firebase
- Create Firebase project
- Enable Firestore Database
- Update `lib/firebase.ts`

4. Start development server
```bash
npx expo start
```

## Core Features

### Authentication System
- User registration with validation
- Email/password authentication
- Session management via Context API

### Course Management
- Course browsing with search functionality
- Category-based filtering
- Course purchase workflow

### Payment Processing
- Account balance management
- Transaction history tracking
- Payment confirmation system

### User Interface
- Responsive design implementation
- Tab-based navigation
- Modern UI components

## Project Structure

```
YogaCustomerApp/
├── screens/           # Application screens
├── navigation/        # Navigation configuration
├── contexts/          # React Context providers
├── components/        # Reusable components
├── lib/              # External configurations
├── hooks/            # Custom React hooks
└── constants/        # Application constants
```

## API Integration

### Firebase Firestore Operations
- Document creation with sequential IDs
- Real-time data synchronization
- Query optimization for performance

### Authentication Flow
```typescript
// User registration
await setDoc(doc(db, 'customers', customerId), userData);

// User authentication
const snapshot = await getDocs(query(collection(db, 'customers'), 
  where('email', '==', email)));
```

## Performance Considerations

- Lazy loading implementation
- Efficient state management
- Optimized database queries
- Memory leak prevention

## Security Implementation

- Input validation and sanitization
- Email uniqueness verification
- Secure password handling
- Session state management

## Testing Methodology

- Manual testing procedures
- Error handling validation
- User flow verification
- Database operation testing

## Deployment

### Development
```bash
npx expo start
```

### Production Build
```bash
expo build:ios
expo build:android
```

## Future Enhancements

- Push notification system
- Offline functionality
- Advanced analytics
- Multi-language support

## Conclusion

This application demonstrates modern mobile development practices using React Native and Firebase. The implementation provides a scalable foundation for yoga course management with comprehensive user authentication and payment processing capabilities.

---

**Developed by Trần Quang Đại**
**Technology Stack: React Native, TypeScript, Firebase**