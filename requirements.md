# Simple TOTP Authenticator App

## Overview
A minimal React Native application that generates Time-based One-Time Passwords (TOTP) similar to Google Authenticator, with a focus on modern UI and offline-first design.

## Phase 1: Core Functionality & Account Management (Current)
- **Data Source**: Persistent and encrypted local storage for all secrets and metadata.
- **Implementation Constraints**: Keep it native. Do not use external libraries for TOTP generation (implement Base32 decoding and HMAC-SHA1 purely in TypeScript).
- **Core Features**:
  - **Account List**: Display a scrollable list of configured accounts.
  - **TOTP Generation**: Generate and display a standard 6-digit TOTP code for each account based on the current time and secret.
  - **Auto-Refresh**: Automatically calculate and update the tokens every 30 seconds.
  - **Timer Indicator**: A visual indicator (like a countdown timer or progress ring) that shows the remaining validity time for the current tokens.
- **Account Management**:
  - **Adding Accounts**: Support adding new accounts via QR Code scanning or manual entry.
  - **Account Metadata**: Support saving additional data with each account:
    - **Notes**: General plaintext notes (e.g., account hints, usage details).
    - **Secure Texts**: Hidden/encrypted text fields for sensitive data (e.g., backup/recovery codes, secondary passwords).
  - Ability to edit, reorder, or delete accounts.
- **UI/UX**:
  - Clean, minimal, and modern list interface.
  - Large, easily readable fonts for the 6-digit codes.
  - **Onboarding/Splash Screen**: A simple, one-time introductory screen shown on the first launch. It should explain the app's core purpose (TOTP generation) and emphasize security (e.g., "Fully offline", "Encrypted local storage").
  - **Theme Strategy**: Use the Arctic Nord color palette for both light and dark modes.
    - **Dark Mode (Polar Night)**: Backgrounds like `#2E3440` and `#3B4252`.
    - **Light Mode (Snow Storm)**: Backgrounds like `#ECEFF4` and `#E5E9F0`.
    - **Accents (Frost/Aurora)**: Use `#88C0D0` or `#81A1C1` for primary highlights (like the TOTP code), and `#A3BE8C` (green) / `#BF616A` (red) for timer warnings.

## Phase 2: Security & Cloud Backups (Planned)
- **Security Integrations**: Biometric lock screen (Face ID / Touch ID) to access the app and to securely reveal 'Secure Texts'.
- **Cloud Backups**: Online encrypted backups to securely sync accounts and metadata across devices.
