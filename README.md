# TabNavi Password Manager
A secure, cross-platform password management application built with React Native. TabNavi provides robust password management features including secure storage, password generation, and data breach monitoring, all while ensuring your credentials remain safe both online and offline.

## 📱 Demo
![TabNavi Demo](./video.mov)

> Note: If you want to see the full video demo, check out our [demo video](./video.mov) on Google Drive.

## 🚀 Features
- **Secure Storage**: Military-grade encryption for local and cloud storage of passwords
- **Cross-Platform**: Seamless experience across iOS and Android devices
- **Password Generation**: Create strong, unique passwords with customizable parameters
- **Smart Organization**: Categorize passwords into folders (banking, social, work, etc.)
- **Enhanced Security**: Multi-factor authentication with biometric options
- **Password Recovery**: Secure recovery mechanisms via email 
- **Breach Monitoring**: Real-time alerts for compromised credentials
- **Offline Access**: Secure access to encrypted passwords without internet connection

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

### Android
```bash
# Run on Android emulator
npm run android
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
