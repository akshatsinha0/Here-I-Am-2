# Project Structure

Generated on: 6/18/2025, 3:03:57 AM
Root: e:\HereIAm2

```
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── models/
│   │   │   ├── Conversation.ts
│   │   │   ├── Message.ts
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── conversationRoutes.ts
│   │   │   ├── messageRoutes.ts
│   │   │   └── users.ts
│   │   ├── services/
│   │   │   └── emailService.ts
│   │   ├── types/
│   │   │   └── expres/
│   │   │       └── index.d.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .dockerignore
│   ├── .gitignore
│   ├── .gitkeep
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── Dockerfile
│   ├── mongodb-deployment.yaml
│   ├── mongodb-service.yaml
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/
│   │   │   └── defaultAvatar.png
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Auth.tsx
│   │   │   │   ├── AuthModal.tsx
│   │   │   │   ├── EmailVerificationStatus.css
│   │   │   │   ├── EmailVerificationStatus.tsx
│   │   │   │   ├── PasswordGenerator.tsx
│   │   │   │   ├── SignInForm.tsx
│   │   │   │   ├── SignUpForm.tsx
│   │   │   │   └── VerificationResend.tsx
│   │   │   ├── ChatArea/
│   │   │   │   ├── ChatArea.css
│   │   │   │   └── ChatArea.tsx
│   │   │   ├── ChatList/
│   │   │   │   ├── ChatList.css
│   │   │   │   └── ChatList.tsx
│   │   │   ├── Message/
│   │   │   │   ├── Message.css
│   │   │   │   └── Message.tsx
│   │   │   ├── Modals/
│   │   │   │   ├── AuthWarningModal.css
│   │   │   │   ├── AuthWarningModal.tsx
│   │   │   │   ├── ProfileSettingsModal.css
│   │   │   │   └── ProfileSettingsModal.tsx
│   │   │   ├── Navigation/
│   │   │   │   ├── Navigation.css
│   │   │   │   └── Navigation.tsx
│   │   │   ├── OnlineUsers/
│   │   │   │   ├── OnlineUsers.css
│   │   │   │   └── OnlineUsers.tsx
│   │   │   └── UserAvatar/
│   │   │       ├── UserAvatar.css
│   │   │       └── UserAvatar.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ChatContext.tsx
│   │   │   ├── ConversationsContext.tsx
│   │   │   ├── OnlineUsersContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/
│   │   │   └── useTheme.tsx
│   │   ├── services/
│   │   │   └── SocketService.ts
│   │   ├── styles/
│   │   │   ├── Auth.css
│   │   │   └── PasswordGenerator.css
│   │   ├── utils/
│   │   │   └── validation.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── docker-compose.yml
```