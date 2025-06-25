# TabNavi Password Manager
A secure, cross-platform password management application built with React Native. TabNavi provides robust password management features including secure storage, password generation, and data breach monitoring, all while ensuring your credentials remain safe both online and offline.

![Expo](https://img.shields.io/badge/Expo-47.0.0-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.72.0-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## 📱 Demo


https://github.com/user-attachments/assets/9101c93b-c33f-4c10-84d9-c63d28e44f35



> Note: If you want to see the full video demo, check out our [demo video](./video.mov) on Google Drive

## 🚀 Features
- **Secure Storage**: Military-grade encryption for local and cloud storage of passwords
- **Cross-Platform**: Seamless experience across iOS and Android devices
- **Password Generation**: Create strong, unique passwords with customizable parameters
- **Smart Organization**: Categorize passwords into folders (banking, social, work, etc.)
- **Enhanced Security**: Multi-factor authentication with biometric options
- **Password Recovery**: Secure recovery mechanisms via email 
- **Breach Monitoring**: Real-time alerts for compromised credentials
- **Offline Access**: Secure access to encrypted passwords without internet connection
- **Bulk Import**: Import multiple passwords from text files (format: `website : password`)
- **Web Support**: Full-featured web application for desktop access
- **Bulk Import**: Import multiple passwords from text files with format validation

## 📁 Bulk Import Feature

TabNavi supports importing multiple passwords from text files for easy migration from other password managers.

### Format
Create a text file with the following format:
```
website : password
another-site : anotherPassword
# Comments are ignored
work-portal : workPassword123
```

### How to Use
1. Open TabNavi Password Manager
2. Go to the "Passwords" tab
3. Tap the green upload button (📁) next to the add (+) button
4. Select your text file
5. Review the preview and tap "Import All Passwords"

### Security
- All passwords are encrypted using AES-256 encryption during import
- Your master password is used as the encryption key
- Files are processed locally and not stored in plain text

For detailed instructions, see [BULK_IMPORT_GUIDE.md](./BULK_IMPORT_GUIDE.md)

## 🛠 Tech Stack
- React Native
- Expo
- AsyncStorage
- Expo Secure Storage
- React Native Keychain
- React Navigation
- Expo Local Authentication (Biometrics)
- Crypto-js
- Firebase
- UUID

## 📋 Prerequisites
Before running this project, make sure you have the following installed:
- Node.js (v14.0.0 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac users) or Android Studio (for Android development)
- Xcode (for iOS development)

## 🔧 Installation
1. Clone the repository:
```bash
git clone https://github.com/HelloSniperMonkey/tabnavi.git
cd tabnavi
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install iOS dependencies (iOS development only):
```bash
cd ios
pod install
cd ..
```

4. Start the development server:
```bash
expo start
# or
npm start
```

## 📱 Running on Devices
### iOS
```bash
# Run on iOS simulator
npm run ios
```

### Web
```bash
# Run on web browser
npm run web
```

### Building for Production
```bash
# Build web version
npx expo export --platform web

# Deploy to Firebase (if configured)
firebase deploy --only hosting
```

## 📁 Project Structure
```
tabnavi/
├── src/
│   ├── components/     # Reusable components
│   ├── screens/        # App screens
│   ├── navigation/     # Navigation configuration
│   └── types/          # Defining some constant for navigation
├── assets/            # Images and fonts
├── App.js            # Root component
└── app.json          # Expo configuration
```

## 🔒 Security Features
- AES-256 encryption for password storage
- Secure key generation and management
- Biometric authentication integration
- Secure cloud sync with end-to-end encryption
- Automatic app lock on background
- Secure clipboard copying

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👤 Author
[HelloSniperMonkey](https://github.com/HelloSniperMonkey)  
Maintained by [Soumyajyoti Mohanta](mailto:soumyajyotimohanta@gmail.com)

## 🙏 Acknowledgments
- React Native community for mobile development resources
- Expo team for development tools
- Open source security libraries contributors
