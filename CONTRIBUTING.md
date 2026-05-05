# Contributing to PawBook IITB

First off, thank you for considering contributing to PawBook IITB! It's people like you that make this community platform for our campus animals better. We welcome contributions from all IIT Bombay students, whether it's fixing bugs, adding new features, improving documentation, or sharing ideas.

## How Can I Contribute?

### 1. Reporting Bugs
This section guides you through submitting a bug report for PawBook IITB.
- Check the issues tab to see if the bug has already been reported.
- If not, open a new issue.
- Describe the bug clearly. Include steps to reproduce, what you expected to happen, and what actually happened.
- Include screenshots if applicable.

### 2. Suggesting Enhancements
Have an idea to make PawBook IITB better? We'd love to hear it!
- Check if your idea is already in the issues tab.
- If not, open a new issue and use the "Enhancement" label if possible.
- Provide a detailed description of the proposed feature and how it benefits the IITB community.

### 3. Contributing Code
If you want to get your hands dirty and write some code:

#### Prerequisites
- Node.js (v18 or higher recommended)
- `npm` or `pnpm`
- A Supabase account for your local database environment

#### Development Setup
1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/pawbook-iitb.git
   cd pawbook-iitb
   ```
3. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```
4. **Environment Variables**:
   Copy `.env.local.example` to `.env.local` and fill in your Supabase details (see `ENV_SETUP.md` for more info).
5. **Start the development server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app.

#### Branching Strategy
- Create a new branch for your feature or bugfix:
  ```bash
  git checkout -b feature/your-feature-name
  # or
  git checkout -b fix/your-bug-fix
  ```

#### Submitting a Pull Request (PR)
1. Commit your changes with clear, descriptive commit messages.
2. Push your branch to your fork:
   ```bash
   git push origin your-branch-name
   ```
3. Open a Pull Request against the `main` branch of the original repository.
4. Describe your changes in detail in the PR description. Link to any relevant issues.
5. Wait for review! We will try to review your PR as soon as possible.

## Code of Conduct
Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms. Let's keep our community welcoming and respectful.

## Questions?
If you have any questions, feel free to open an issue or reach out to the project maintainers. Happy coding, and thank you for helping our campus animals! 🐾
