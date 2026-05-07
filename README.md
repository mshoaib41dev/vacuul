# Untitled UI starter kit for Vite

This is an official Untitled UI starter kit for Vite. Kickstart your Untitled UI project with Vite in seconds.

## Untitled UI React

[Untitled UI React](https://www.untitledui.com/react) is the world’s largest collection of open-source React UI components. Everything you need to design and develop modern, beautiful interfaces—fast.

Built with React 19.1, Tailwind CSS v4.1, TypeScript 5.8, and React Aria, Untitled UI React components deliver modern performance, type safety, and maintainability.

[Learn more](https://www.untitledui.com/react) • [Documentation](https://www.untitledui.com/react/docs/introduction) • [Figma](https://www.untitledui.com/figma) • [FAQs](https://www.untitledui.com/faqs)

## Getting started

### 1. Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### 2. Environment Setup

The application requires Firebase and Algolia credentials to run. Follow these steps:

#### Create `.env.local` file

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

#### Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your Firebase project
3. Click "Settings" → "Project Settings"
4. Under "Your apps", find your web app configuration
5. Copy these values to `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APPID`

#### Get Algolia Credentials (Optional)

If your app uses search functionality:

1. Go to [Algolia Console](https://www.algolia.com/dashboard)
2. Login to your account
3. Navigate to **Settings** → **API Keys**
4. Copy these values to `.env.local`:
   - `VITE_ALGOLIA_APP_ID` → Application ID
   - `VITE_ALGOLIA_SEARCH_API_KEY` → Search-Only API Key

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the application.

You can start editing the app by modifying the components in `src/` folder. The page auto-updates as you edit the file.

### 5. Important Security Notes

- **Never commit `.env.local`** - It contains sensitive credentials
- The `.gitignore` file already excludes `.env.local` and other sensitive files
- Share `.env.example` (without actual values) in your repository for other developers
- Each developer should create their own `.env.local` file with their credentials

### Troubleshooting

**White blank page on localhost?**
- Make sure `.env.local` is created and filled with valid Firebase credentials
- Check browser console (F12) for errors
- Clear browser cache and reload the page
- Ensure all required environment variables are set in `.env.local`

**Missing API Key errors?**
- Verify your Firebase and Algolia credentials are correct
- Restart the dev server after adding credentials to `.env.local`

## Resources

Untitled UI React is built on top of [Untitled UI Figma](https://www.untitledui.com/figma), the world's largest and most popular Figma UI kit and design system. Explore more:

**[Untitled UI Figma:](https://www.untitledui.com/react/resources/figma-files)** The world's largest Figma UI kit and design system.
<br/>
**[Untitled UI Icons:](https://www.untitledui.com/react/resources/icons)** A clean, consistent, and neutral icon library crafted specifically for modern UI design.
<br/>
**[Untitled UI file icons:](https://www.untitledui.com/react/resources/file-icons)** Free file format icons, designed specifically for modern web and UI design.
<br/>
**[Untitled UI flag icons:](https://www.untitledui.com/react/resources/flag-icons)** Free country flag icons, designed specifically for modern web and UI design.
<br/>
**[Untitled UI avatars:](https://www.untitledui.com/react/resources/avatars)** Free placeholder user avatars and profile pictures to use in your projects.
<br/>
**[Untitled UI logos:](https://www.untitledui.com/react/resources/logos)** Free fictional company logos to use in your projects.

## License

Untitled UI React open-source components are licensed under the MIT license, which means you can use them for free in unlimited commercial projects.

> [!NOTE]
> This license applies only to the starter kit and to the components included in this open-source repository. [Untitled UI React PRO](https://www.untitledui.com/react) includes hundreds more advanced UI components and page examples and is subject to a separate [license agreement](https://www.untitledui.com/license).

[Untitled UI license agreement →](https://www.untitledui.com/license)

[Frequently asked questions →](https://www.untitledui.com/faqs)
