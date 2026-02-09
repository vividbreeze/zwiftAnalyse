# Zwift Training Dashboard 🚴‍♂️

A personal training analysis dashboard that combines **Strava** activity data with **Withings** body composition tracking to provide intelligent coaching insights.

![Dashboard](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![Tests](https://img.shields.io/badge/Tests-13%20passing-green)

## Features

- 📊 **Weekly Training Stats** - Power, HR, efficiency trends over time
- 🏋️ **Body Composition** - Weight, fat %, muscle mass from Withings
- ⚡ **Performance Metrics** - W/kg (Power-to-Weight), Efficiency Factor
- 🤖 **AI Coach Assessment** - Automatic progress analysis and recommendations
- 📈 **HR Zone Distribution** - Estimated time in each training zone
- 🔗 **Multi-Source Integration** - Strava + Withings API

## Quick Start

### Prerequisites

- Node.js 18+
- Strava API Application ([create one here](https://www.strava.com/settings/api))
- Withings Developer Account ([apply here](https://developer.withings.com/))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd zwiftAnalyse

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Strava API credentials
# VITE_STRAVA_CLIENT_ID=your_client_id
# VITE_STRAVA_CLIENT_SECRET=your_client_secret

# Start development server
npm run dev
```

### Withings Setup

Withings credentials are entered through the app's Settings UI (⚙️ button):
1. Click the settings icon in the dashboard
2. Enter your Withings Client ID and Secret
3. Click "Mit Withings verbinden" button

## Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run

# Lint code
npm run lint

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx      # Main dashboard with charts
│   ├── CoachAssessment.jsx # AI coaching insights
│   ├── SummaryCard.jsx    # Metric display cards
│   ├── FormatFeedback.jsx # Text formatting helper
│   ├── Settings.jsx       # API configuration
│   └── WithingsCallback.jsx
├── services/
│   ├── analysis.js        # Training analysis functions
│   ├── strava.js          # Strava API integration
│   └── withings.js        # Withings API integration
├── config/
│   └── user.js            # User profile & HR zones
└── test/
    └── setup.js           # Test configuration
```

## Key Metrics

| Metric | Description | Good Values |
|--------|-------------|-------------|
| **Efficiency Factor** | Power / Avg HR | 1.0+ is trained |
| **W/kg** | Power / Weight | 3.0+ is ambitious |
| **HR Zone Balance** | Z2 time vs intensity | 80/20 rule |

## Tech Stack

- **Frontend**: React 19, Chart.js, TailwindCSS
- **Build**: Vite 7
- **Testing**: Vitest, React Testing Library
- **APIs**: Strava OAuth, Withings OAuth

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Run tests (`npm run test:run`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing`)
6. Open a Pull Request

## License

MIT

---

Built with ❤️ for cycling enthusiasts
